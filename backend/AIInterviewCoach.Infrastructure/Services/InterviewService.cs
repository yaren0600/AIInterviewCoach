using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Domain.Entities;
using AIInterviewCoach.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;


namespace AIInterviewCoach.Infrastructure.Services;

public class InterviewService : IInterviewService
{

    private readonly AppDbContext _context;
    private readonly IAiEvaluationService _aiEvaluationService;

    public InterviewService(
        AppDbContext context,
        IAiEvaluationService aiEvaluationService)
    {
        _context = context;
        _aiEvaluationService = aiEvaluationService;
    }

    /// <summary>
    /// Yeni bir mülakat oturumu başlatır.
    /// Bu metot artık sadece position/resume bilgisine göre değil;
    /// frontend'den gelen QuestionCount, Difficulty ve InterviewMode değerlerine göre soru üretir.
    /// </summary>
    public async Task<InterviewSessionDto?> StartInterviewAsync(int userId, StartInterviewRequestDto request)
    {
        // 1) Kullanıcının seçtiği pozisyon veritabanında var mı kontrol ediyoruz.
        var position = await _context.Positions
            .FirstOrDefaultAsync(x => x.Id == request.PositionId);

        if (position is null)
        {
            return null;
        }

        // 2) Kullanıcı CV seçtiyse, bu CV gerçekten bu kullanıcıya mı ait kontrol ediyoruz.
        // Böylece başka bir kullanıcının CV'siyle mülakat başlatılması engellenir.
        Resume? resume = null;

        if (request.ResumeId.HasValue)
        {
            resume = await _context.Resumes
                .FirstOrDefaultAsync(r =>
                    r.Id == request.ResumeId.Value &&
                    r.UserId == userId);

            if (resume is null)
            {
                return null;
            }
        }

        // 3) Önce mülakat oturumunu oluşturuyoruz.
        // Soruları bu session.Id ile ilişkilendireceğimiz için önce session kaydedilmeli.
        var session = new InterviewSession
        {
            UserId = userId,
            PositionId = request.PositionId,
            StartedAt = DateTime.Now,
            CompletedAt = null,
            TotalScore = null
        };

        _context.InterviewSessions.Add(session);
        await _context.SaveChangesAsync();

        // 4) CV varsa içindeki skill/teknolojileri tespit ediyoruz.
        // CV yoksa boş liste ile devam ediyoruz.
        var detectedSkills = !string.IsNullOrWhiteSpace(resume?.ExtractedText)
            ? DetectSkillsFromText(resume.ExtractedText)
            : new List<string>();

        // 5) Yeni ayarlara göre soru üretiyoruz:
        // - request.QuestionCount: kaç soru üretilecek?
        // - request.Difficulty: Beginner / Intermediate / Advanced
        // - request.InterviewMode: Role-Based / CV-Based / Technical / Behavioral / Mixed
        // Kullanıcının frontend'de seçtiği mode/difficulty/question count değerlerine göre soru üretir.
        // Örneğin Behavioral seçildiyse sadece davranışsal sorular gelir.
        var questions = GenerateQuestionsBySelectedMode(
            positionName: position.Name,
            sessionId: session.Id,
            detectedSkills: detectedSkills,
            request: request
        );

        _context.Questions.AddRange(questions);
        await _context.SaveChangesAsync();

        // 6) Frontend'e session bilgisini ve oluşturulan soruları dönüyoruz.
        return new InterviewSessionDto
        {
            Id = session.Id,
            UserId = session.UserId,
            PositionId = session.PositionId,
            PositionName = position.Name,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            TotalScore = session.TotalScore,
            Questions = questions.Select(q => new QuestionDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                Difficulty = q.Difficulty,
                Category = q.Category
            }).ToList()
        };
    }

    /// <summary>
    /// Frontend'den gelen InterviewMode değerine göre hangi soru tiplerinin üretileceğini belirler.
    /// 
    /// Örnekler:
    /// - Behavioral seçilirse sadece davranışsal sorular gelir.
    /// - CV-Based seçilirse sadece CV/skill bazlı sorular gelir.
    /// - Technical seçilirse teknik sorular gelir.
    /// - Role-Based seçilirse pozisyon odaklı sorular gelir.
    /// - Mixed seçilirse hepsinden karışık gelir.
    /// </summary>
    private List<Question> GenerateQuestionsBySelectedMode(
        string positionName,
        int sessionId,
        List<string> detectedSkills,
        StartInterviewRequestDto request)
    {
        // Frontend'den gelen değerleri güvenli/standart hale getiriyoruz.
        // Örn: "Behavioral", "behavioral" veya " behavioral " gelse bile doğru çalışır.
        var selectedMode = NormalizeInterviewMode(request.InterviewMode);
        var selectedDifficulty = NormalizeDifficulty(request.Difficulty);

        // Kullanıcı 5/8/10/15 seçiyor. Yine de güvenlik için 5-15 arasına sıkıştırıyoruz.
        var selectedQuestionCount = Math.Clamp(request.QuestionCount, 5, 15);

        // Önce soruları veritabanı entity'si olarak değil, geçici GeneratedQuestion modeliyle topluyoruz.
        // En sonda Question entity'sine dönüştürüp database'e kaydedeceğiz.
        var questionDrafts = new List<GeneratedQuestion>();

        if (selectedMode == "behavioral")
        {
            // Behavioral mode seçildiyse pozisyon sorusu üretmiyoruz.
            // Business Analyst seçili olsa bile sadece davranışsal sorular gelir.
            questionDrafts.AddRange(GenerateBehavioralQuestions(sessionId).Select(q => new GeneratedQuestion
            {
                Text = q.QuestionText,
                Category = q.Category,
                Difficulty = selectedDifficulty
            }));
        }
        else if (selectedMode == "cv-based")
        {
            // CV-Based mode seçildiyse önce CV'den yakalanan skill'lere göre özel sorular üretir.
            questionDrafts.AddRange(GetSkillBasedCvQuestions(detectedSkills, selectedDifficulty));

            // CV'den skill yakalanmadıysa genel CV/proje soruları ekler.
            if (!questionDrafts.Any())
            {
                questionDrafts.AddRange(GetCvBasedQuestions(resumeText: null, difficulty: selectedDifficulty));
            }

        }
        else if (selectedMode == "technical")
        {
            // Technical mode seçildiyse sadece teknik sorular gelir.
            questionDrafts.AddRange(GetTechnicalQuestions(positionName, selectedDifficulty));
        }
        else if (selectedMode == "sql-practice")
        {
            // SQL Practice seçildiyse sadece SQL soru havuzu gelir.
            questionDrafts.AddRange(GetSqlPracticeQuestions(selectedDifficulty));
        }
        else if (selectedMode == "coding-practice")
        {
            questionDrafts.AddRange(GetCodingPracticeQuestions(
                selectedDifficulty,
                request.ProgrammingLanguage));
        }
        else if (selectedMode == "role-based")
        {
            // Role-Based mode seçildiyse pozisyona özel genel mülakat soruları gelir.
            questionDrafts.AddRange(GetRoleBasedQuestions(positionName, selectedDifficulty));
        }
        else
        {
            // Mixed mode: her kategoriden karışık soru üretir.
            questionDrafts.AddRange(GetRoleBasedQuestions(positionName, selectedDifficulty));
            questionDrafts.AddRange(GetSkillBasedCvQuestions(detectedSkills, selectedDifficulty));
            questionDrafts.AddRange(GetTechnicalQuestions(positionName, selectedDifficulty));
            questionDrafts.AddRange(GenerateBehavioralQuestions(sessionId).Select(q => new GeneratedQuestion
            {
                Text = q.QuestionText,
                Category = q.Category,
                Difficulty = selectedDifficulty
            }));
        }

        // 10 veya 15 soru seçildiğinde mevcut modda yeterli soru yoksa listeyi tamamlar.
        AddFallbackQuestionsIfNeeded(
            questionDrafts,
            positionName,
            selectedDifficulty,
            selectedQuestionCount);

        // Aynı soru iki kere oluşursa tekilleştiriyoruz.
        // Sonra seçilen soru sayısı kadar alıp Question entity'sine dönüştürüyoruz.
        return questionDrafts
            .GroupBy(q => q.Text)
            .Select(g => g.First())
            .Take(selectedQuestionCount)
            .Select(q => new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = q.Text,
                Category = q.Category,
                Difficulty = q.Difficulty
            })
            .ToList();
    }

    /// <summary>
    /// Frontend'den gelen difficulty değerini standart hale getirir.
    /// Böylece "beginner", "Beginner", "BEGINNER" gibi değerler sorun çıkarmaz.
    /// </summary>
    private string NormalizeDifficulty(string? difficulty)
    {
        var normalizedDifficulty = difficulty?.Trim().ToLower();

        return normalizedDifficulty switch
        {
            "beginner" => "Beginner",
            "advanced" => "Advanced",
            _ => "Intermediate"
        };
    }

    /// <summary>
    /// Frontend'den gelen interview mode değerini standart hale getirir.
    /// </summary>
    private string NormalizeInterviewMode(string? interviewMode)
    {
        var normalizedMode = interviewMode?.Trim().ToLower();

        return normalizedMode switch
        {
            "role-based" => "role-based",
            "cv-based" => "cv-based",
            "technical" => "technical",
            "behavioral" => "behavioral",
            "mixed" => "mixed",

            // Frontend "SQL Practice" gönderdiği için bunu özellikle yakalıyoruz.
            "sql practice" => "sql-practice",
            "sql-practice" => "sql-practice",
            "sql" => "sql-practice",

            "coding practice" => "coding-practice",
            "coding-practice" => "coding-practice",
            "coding" => "coding-practice",

            _ => "mixed"
        };
    }

    /// <summary>
    /// Frontend'den gelen programlama dili değerini standart hale getirir.
    /// </summary>
    private string NormalizeProgrammingLanguage(string? programmingLanguage)
    {
        var normalizedLanguage = programmingLanguage?.Trim().ToLower();

        return normalizedLanguage switch
        {
            "python" => "Python",
            "javascript" => "JavaScript",
            "js" => "JavaScript",
            "c#" => "C#",
            "csharp" => "C#",
            "c sharp" => "C#",
            _ => "C#"
        };
    }

    /// <summary>
    /// Soru sayısı yetmezse listeyi genel ama mantıklı sorularla tamamlar.
    /// Bu özellikle 10 veya 15 soru seçildiğinde önemlidir.
    /// </summary>
    private void AddFallbackQuestionsIfNeeded(
        List<GeneratedQuestion> questionDrafts,
        string positionName,
        string difficulty,
        int requestedQuestionCount)
    {
        var fallbackQuestions = new List<GeneratedQuestion>
        {
            new()
            {
                Text = $"{positionName} pozisyonu için seni iyi bir aday yapan özellikler nelerdir?",
                Category = "Role-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Gurur duyduğun bir projeyi ve bu projeden neler öğrendiğini anlatır mısın?",
                Category = "CV-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Başta çözümünü bilmediğin bir problemle karşılaştığında nasıl ilerlersin?",
                Category = "Problem Solving",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Teknik bir konuyu teknik olmayan bir paydaşa nasıl açıklarsın?",
                Category = "Communication",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Teslim tarihine yakın proje gereksinimleri değişirse nasıl hareket edersin?",
                Category = "Behavioral",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Farklı önceliklere sahip birden fazla görevin olduğunda işlerini nasıl organize edersin?",
                Category = "Behavioral",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Yaptığın işin doğru çalıştığını nasıl test eder veya doğrularsın?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Geliştirmek istediğin bir teknik konu nedir ve bunu nasıl geliştirmeyi planlıyorsun?",
                Category = "Learning",
                Difficulty = difficulty
            }
        };

        foreach (var fallbackQuestion in fallbackQuestions)
        {
            if (questionDrafts.Count >= requestedQuestionCount)
            {
                break;
            }

            var alreadyExists = questionDrafts.Any(q => q.Text == fallbackQuestion.Text);

            if (!alreadyExists)
            {
                questionDrafts.Add(fallbackQuestion);
            }
        }
    }

    /// <summary>
    /// Pozisyona özel, role-based sorular üretir.
    /// </summary>
    private List<GeneratedQuestion> GetRoleBasedQuestions(
        string positionName,
        string difficulty)
    {
        if (difficulty == "Beginner")
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = $"{positionName} pozisyonuyla neden ilgilendiğini açıklar mısın?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"Bir {positionName} pozisyonunun temel sorumlulukları nelerdir?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"Bir {positionName} için en önemli beceriler sence nelerdir?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                }
            };
        }

        if (difficulty == "Advanced")
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = $"{positionName} rolünde gerçek hayatta karşılaşabileceğin karmaşık bir problemi nasıl ele alırsın?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"{positionName} rolünde farklı paydaşlar farklı çıktılar beklerse görevleri nasıl önceliklendirirsin?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"Bir {positionName} olarak ilk üç ayındaki başarını nasıl ölçersin?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                }
            };
        }

        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = $"Geçmiş deneyimlerin {positionName} pozisyonunda başarılı olmana nasıl katkı sağlar?",
                Category = "Role-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = $"{positionName} pozisyonuyla ilgili bir proje veya deneyimini anlatır mısın?",
                Category = "Role-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = $"{positionName} rolünde hangi zorluklarla karşılaşabileceğini düşünüyorsun ve bunları nasıl yönetirsin?",
                Category = "Role-Based",
                Difficulty = difficulty
            }
        };
    }

    /// <summary>
    /// CV varsa CV'ye göre, CV yoksa genel CV/proje soruları üretir.
    /// </summary>
    private List<GeneratedQuestion> GetCvBasedQuestions(
        string? resumeText,
        string difficulty)
    {
        var hasResume = !string.IsNullOrWhiteSpace(resumeText);

        if (!hasResume)
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = "Geçmişindeki bir projeyi ve bu projedeki rolünü anlatır mısın?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Geçmişindeki hangi teknik beceride kendini en güçlü hissediyorsun?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                }
            };
        }

        if (difficulty == "Beginner")
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = "CV’ndeki bir projeyi basit ve anlaşılır şekilde açıklar mısın?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "CV’ndeki teknolojilerden hangisini en aktif şekilde kullandın?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                }
            };
        }

        if (difficulty == "Advanced")
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = "CV’ndeki bir projeyi seçip mimarisini, teknik kararlarını ve sınırlılıklarını açıklar mısın?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "CV’ndeki projelerden birini bugün yeniden geliştirseydin neyi iyileştirirdin?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "CV’ndeki projelerden birinde yaptığın teknoloji seçimlerini gerekçeleriyle açıklayabilir misin?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                }
            };
        }

        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "CV’ndeki bir projeyi ve bu projedeki temel sorumluluklarını anlatır mısın?",
                Category = "CV-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "CV’ndeki bir projede hangi teknik zorlukla karşılaştın ve bunu nasıl çözdün?",
                Category = "CV-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "CV’ndeki projeler problem çözme becerini nasıl geliştirdi?",
                Category = "CV-Based",
                Difficulty = difficulty
            }
        };
    }

    /// <summary>
    /// CV'de tespit edilen skill'lere göre daha özel CV soruları üretir.
    /// </summary>
    private List<GeneratedQuestion> GetSkillBasedCvQuestions(
        List<string> detectedSkills,
        string difficulty)
    {
        var questions = new List<GeneratedQuestion>();

        if (detectedSkills.Contains("ASP.NET Core"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde ASP.NET Core yer alıyor. Bir projende controller, service ve repository katmanlarını nasıl yapılandırdın?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("SQL"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde SQL yer alıyor. INNER JOIN ve LEFT JOIN farkını proje bağlantılı bir örnekle açıklar mısın?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Python"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde Python yer alıyor. Veri işleme veya analiz için hangi kütüphaneleri kullandın ve neden?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("OpenCV"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde OpenCV yer alıyor. Görüntü işleme projende grayscale, threshold veya contour işlemlerini neden kullandın?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Power BI"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde Power BI yer alıyor. Bir dashboard tasarlarken metrikleri ve görselleştirmeleri nasıl seçersin?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("JWT"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde JWT yer alıyor. JWT tabanlı authentication sürecinde token üretme ve doğrulama aşamalarını açıklar mısın?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Docker"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde Docker yer alıyor. Bir uygulamayı container içine almanın avantajları nelerdir?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Kotlin") || detectedSkills.Contains("Android"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde Android/Kotlin yer alıyor. Android uygulamasında kullanıcı girdisini alma ve veriyi işleme sürecini nasıl yönettin?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Machine Learning"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde Machine Learning yer alıyor. Bir modeli değerlendirirken hangi metrikleri kullanırsın?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Git"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "CV’nde Git/GitHub yer alıyor. Takım çalışmasında branch, commit ve pull request süreçlerini nasıl yönetirsin?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        return questions;
    }

    /// <summary>
    /// Teknik mülakat soruları üretir.
    /// </summary>
    private List<GeneratedQuestion> GetTechnicalQuestions(
        string positionName,
        string difficulty)
    {
        if (difficulty == "Beginner")
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = "API nedir ve yazılım uygulamalarında neden kullanılır?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Frontend ve backend arasındaki fark nedir?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Veritabanı nedir ve uygulamalar neden veritabanına ihtiyaç duyar?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Git yazılım geliştirmede ne için kullanılır?",
                    Category = "Technical",
                    Difficulty = difficulty
                }
            };
        }

        if (difficulty == "Advanced")
        {
            return new List<GeneratedQuestion>
            {
                new()
                {
                    Text = "Bir mülakat hazırlık platformu için ölçeklenebilir bir backend mimarisini nasıl tasarlarsın?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "API cevap süreleri yavaşlarsa performansı iyileştirmek için neler yaparsın?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Bir web uygulamasında authentication ve authorization süreçlerini güvenli şekilde nasıl yönetirsin?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"{positionName} odaklı bir projeye başlamadan önce hangi teknik riskleri değerlendirirsin?",
                    Category = "Technical",
                    Difficulty = difficulty
                }
            };
        }

        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "Controller-Service-Repository yapısını açıklar mısın?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JWT authentication’ın amacı nedir?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "SQL’de INNER JOIN ve LEFT JOIN arasındaki fark nedir?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Dependency Injection nedir ve neden faydalıdır?",
                Category = "Technical",
                Difficulty = difficulty
            }
        };
    }

    /// <summary>
    /// SQL Practice modu için SQL odaklı mülakat/pratik soruları üretir.
    /// Şimdilik cevaplar metin olarak değerlendiriliyor.
    /// İleride burada gerçek SQL sorgusu çalıştırma ve çıktı kontrolü ekleyebiliriz.
    /// </summary>
    private List<GeneratedQuestion> GetSqlPracticeQuestions(string difficulty)
    {
        if (difficulty == "Beginner")
        {
            return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "SELECT komutu SQL'de ne işe yarar? Basit bir örnekle açıklar mısın?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "WHERE koşulu SQL sorgularında neden kullanılır? Örnek bir sorgu yazar mısın?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "ORDER BY komutu ne işe yarar? Artan ve azalan sıralama farkını açıklar mısın?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "COUNT fonksiyonu ne işe yarar? Bir tabloda toplam kayıt sayısını nasıl bulursun?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "SQL'de primary key ve foreign key kavramlarını açıklar mısın?",
                Category = "SQL Practice",
                Difficulty = difficulty
            }
        };
        }

        if (difficulty == "Advanced")
        {
            return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "Müşteriler ve siparişler tabloları için, hiç siparişi olmayan müşterileri listeleyen SQL sorgusunu nasıl yazarsın?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "GROUP BY ve HAVING kullanarak toplam sipariş tutarı 10000'den fazla olan müşterileri nasıl listelersin?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Bir tabloda tekrar eden email kayıtlarını tespit etmek için nasıl bir SQL sorgusu yazarsın?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Alt sorgu kullanarak maaşı departman ortalamasının üzerinde olan çalışanları nasıl listelersin?",
                Category = "SQL Practice",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Index kullanımı sorgu performansını nasıl etkiler? Yanlış index kullanımının olası zararları nelerdir?",
                Category = "SQL Practice",
                Difficulty = difficulty
            }
        };
        }

        return new List<GeneratedQuestion>
    {
        new()
        {
            Text = "INNER JOIN ve LEFT JOIN arasındaki farkı örnek bir senaryo üzerinden açıklar mısın?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "GROUP BY ne işe yarar? Bir satış tablosunda kategoriye göre toplam satış tutarını nasıl hesaplarsın?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Bir tabloda belirli tarih aralığındaki kayıtları filtrelemek için nasıl bir SQL sorgusu yazarsın?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "NULL değerleri SQL sorgularında nasıl kontrol edersin? IS NULL ve IS NOT NULL kullanımını açıklar mısın?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "UPDATE ve DELETE komutlarını kullanırken nelere dikkat etmelisin?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Bir tabloda en yüksek maaşa sahip ilk 5 çalışanı listelemek için nasıl bir sorgu yazarsın?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "SQL'de LIKE operatörü ne işe yarar? İsim içinde belirli bir kelime geçen kayıtları nasıl bulursun?",
            Category = "SQL Practice",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Bir rapor ekranı için SQL sorgusu yazarken performans açısından nelere dikkat edersin?",
            Category = "SQL Practice",
            Difficulty = difficulty
        }
    };
    }


    /// <summary>
    /// Coding Practice modu için seçilen programlama diline göre kodlama soruları üretir.
    /// Şimdilik kullanıcı cevabı metin/kod olarak alınır ve rule-based değerlendirilir.
    /// İleride burada kod çalıştırma veya AI destekli kod değerlendirme eklenebilir.
    /// </summary>
    private List<GeneratedQuestion> GetCodingPracticeQuestions(
        string difficulty,
        string? programmingLanguage)
    {
        var language = NormalizeProgrammingLanguage(programmingLanguage);

        if (language == "Python")
        {
            return GetPythonCodingQuestions(difficulty);
        }

        if (language == "JavaScript")
        {
            return GetJavaScriptCodingQuestions(difficulty);
        }

        return GetCSharpCodingQuestions(difficulty);
    }

    private List<GeneratedQuestion> GetCSharpCodingQuestions(string difficulty)
    {
        if (difficulty == "Beginner")
        {
            return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "C# ile verilen bir sayı dizisindeki en büyük sayıyı bulan bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile verilen bir string ifadenin tersini döndüren bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile verilen bir sayı dizisindeki çift sayıları listeleyen bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile verilen bir string içinde kaç tane sesli harf olduğunu bulan bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile 1'den n'e kadar olan sayıların toplamını döndüren bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            }
        };
        }

        if (difficulty == "Advanced")
        {
            return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "C# ile bir listedeki tekrar eden elemanları tespit eden ve her elemanın kaç kez geçtiğini döndüren bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile verilen bir string ifadenin palindrome olup olmadığını kontrol eden bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile iki sıralı diziyi tek bir sıralı dizi halinde birleştiren bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile verilen bir listedeki en sık tekrar eden elemanı bulan bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            },
            new()
            {
                Text = "C# ile bir metindeki kelime frekanslarını Dictionary kullanarak hesaplayan bir metot yaz.",
                Category = "Coding Practice - C#",
                Difficulty = difficulty
            }
        };
        }

        return new List<GeneratedQuestion>
    {
        new()
        {
            Text = "C# ile verilen bir dizideki sayıların ortalamasını hesaplayan bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile verilen bir string ifadenin boş veya null olup olmadığını kontrol eden bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile bir listedeki tek sayıları filtreleyen bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile verilen iki sayıdan büyük olanı döndüren bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile bir listedeki string değerleri alfabetik olarak sıralayan bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile bir dizide belirli bir elemanın bulunup bulunmadığını kontrol eden bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile verilen bir string içindeki boşlukları kaldıran bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        },
        new()
        {
            Text = "C# ile bir listedeki eleman sayısını döndüren basit bir metot yaz.",
            Category = "Coding Practice - C#",
            Difficulty = difficulty
        }
    };
    }

    private List<GeneratedQuestion> GetPythonCodingQuestions(string difficulty)
{
    if (difficulty == "Beginner")
    {
        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "Python ile verilen bir listedeki en büyük sayıyı bulan bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile verilen bir string ifadenin tersini döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile verilen bir listedeki çift sayıları döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile 1'den n'e kadar olan sayıların toplamını hesaplayan bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile verilen bir kelimenin kaç karakterden oluştuğunu döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            }
        };
    }

    if (difficulty == "Advanced")
    {
        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "Python ile bir listedeki tekrar eden elemanları ve tekrar sayılarını dictionary olarak döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile verilen bir string ifadenin palindrome olup olmadığını kontrol eden bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile bir metindeki kelime frekanslarını hesaplayan bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile iki sıralı listeyi tek bir sıralı liste halinde birleştiren bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Python ile bir listedeki en sık tekrar eden elemanı bulan bir fonksiyon yaz.",
                Category = "Coding Practice - Python",
                Difficulty = difficulty
            }
        };
    }

    return new List<GeneratedQuestion>
    {
        new()
        {
            Text = "Python ile verilen bir listedeki sayıların ortalamasını hesaplayan bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile verilen bir listedeki tek sayıları filtreleyen bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile verilen iki sayıdan büyük olanı döndüren bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile verilen bir string içindeki boşlukları kaldıran bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile bir listenin boş olup olmadığını kontrol eden bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile bir listedeki string değerleri alfabetik olarak sıralayan bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile verilen bir cümlede kaç kelime olduğunu bulan bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        },
        new()
        {
            Text = "Python ile bir listedeki benzersiz elemanları döndüren bir fonksiyon yaz.",
            Category = "Coding Practice - Python",
            Difficulty = difficulty
        }
    };
}

    private List<GeneratedQuestion> GetJavaScriptCodingQuestions(string difficulty)
    {
        if (difficulty == "Beginner")
        {
            return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "JavaScript ile verilen bir dizideki en büyük sayıyı bulan bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile verilen bir string ifadenin tersini döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile verilen bir dizideki çift sayıları döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile 1'den n'e kadar olan sayıların toplamını hesaplayan bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile verilen bir string ifadenin uzunluğunu döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            }
        };
        }

        if (difficulty == "Advanced")
        {
            return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "JavaScript ile bir dizideki tekrar eden elemanları ve tekrar sayılarını object olarak döndüren bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile verilen bir string ifadenin palindrome olup olmadığını kontrol eden bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile bir metindeki kelime frekanslarını hesaplayan bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile iki sıralı diziyi tek bir sıralı dizi halinde birleştiren bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            },
            new()
            {
                Text = "JavaScript ile bir dizide en sık tekrar eden elemanı bulan bir fonksiyon yaz.",
                Category = "Coding Practice - JavaScript",
                Difficulty = difficulty
            }
        };
        }

        return new List<GeneratedQuestion>
    {
        new()
        {
            Text = "JavaScript ile verilen bir dizideki sayıların ortalamasını hesaplayan bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile verilen bir dizideki tek sayıları filtreleyen bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile verilen iki sayıdan büyük olanı döndüren bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile verilen bir string içindeki boşlukları kaldıran bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile bir dizinin boş olup olmadığını kontrol eden bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile bir dizide belirli bir elemanın bulunup bulunmadığını kontrol eden bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile verilen bir cümlede kaç kelime olduğunu bulan bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        },
        new()
        {
            Text = "JavaScript ile bir dizideki benzersiz elemanları döndüren bir fonksiyon yaz.",
            Category = "Coding Practice - JavaScript",
            Difficulty = difficulty
        }
    };
    }

    /// <summary>
    /// Davranışsal mülakat sorularını üretir.
    /// Bu sorular pozisyondan bağımsızdır.
    /// Yani kullanıcı Business Analyst seçse bile InterviewMode Behavioral ise buradaki sorular gelir.
    /// </summary>
    private List<Question> GenerateBehavioralQuestions(int sessionId)
    {
        return new List<Question>
    {
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Bize kendinden bahseder misin?",
            Difficulty = "Easy",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Güçlü yönlerin nelerdir ve bunlar profesyonel hayatta sana nasıl katkı sağlar?",
            Difficulty = "Easy",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Neden seni işe almalıyız?",
            Difficulty = "Easy",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Zor bir problemi çözdüğün bir zamanı anlatır mısın?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Bilmediğin bir teknoloji veya konu ile karşılaştığında nasıl öğrenirsin?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Takım çalışması yaptığın bir deneyimini anlatır mısın?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Eleştirel bir geri bildirim aldığında nasıl tepki verirsin?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Bir ekip arkadaşı veya paydaşla fikir ayrılığı yaşadığında bunu nasıl yönetirsin?",
            Difficulty = "Advanced",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Belirsizlik içeren bir projede nasıl ilerlersin?",
            Difficulty = "Advanced",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Birden fazla görev veya teslim tarihi olduğunda stresini nasıl yönetirsin?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Yaptığın bir hatayı ve bu hatadan ne öğrendiğini anlatır mısın?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Teknik bir konuyu teknik olmayan bir kişiye nasıl açıklarsın?",
            Difficulty = "Advanced",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Kendine koyduğun bir hedefi ve bu hedefe nasıl ulaştığını anlatır mısın?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Her şey acil görünüyorsa işlerini nasıl önceliklendirirsin?",
            Difficulty = "Advanced",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Kendini profesyonel olarak geliştirmek için seni motive eden şey nedir?",
            Difficulty = "Easy",
            Category = "Behavioral"
        }
    };
    }

    /// <summary>
    /// Cevap kaydetme/değerlendirme metodu.
    /// Kullanıcı aynı soruya tekrar cevap verirse eski cevabı günceller.
    /// </summary>

    public async Task<AnswerDto?> SubmitAnswerAsync(int userId, SubmitAnswerRequestDto request)
    {
        var question = await _context.Questions
            .Include(q => q.InterviewSession)
                .ThenInclude(s => s.Position)
            .Include(q => q.Answer)
            .FirstOrDefaultAsync(q =>
                q.Id == request.QuestionId &&
                q.InterviewSession.UserId == userId);

        if (question is null)
        {
            return null;
        }

        var aiEvaluation = await _aiEvaluationService.EvaluateAnswerAsync(
            question.QuestionText,
            request.UserAnswer,
            question.Category,
            question.Difficulty,
            question.InterviewSession.Position.Name);

        if (question.Answer is not null)
        {
            question.Answer.UserAnswer = request.UserAnswer;
            question.Answer.Score = aiEvaluation.Score;
            question.Answer.Feedback = aiEvaluation.Feedback;
            question.Answer.AnsweredAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return new AnswerDto
            {
                Id = question.Answer.Id,
                QuestionId = question.Answer.QuestionId,
                UserAnswer = question.Answer.UserAnswer,
                Score = question.Answer.Score,
                Feedback = question.Answer.Feedback,
                AnsweredAt = question.Answer.AnsweredAt
            };
        }

        var answer = new Answer
        {
            QuestionId = question.Id,
            UserAnswer = request.UserAnswer,
            Score = aiEvaluation.Score,
            Feedback = aiEvaluation.Feedback,
            AnsweredAt = DateTime.Now
        };

        _context.Answers.Add(answer);
        await _context.SaveChangesAsync();

        return new AnswerDto
        {
            Id = answer.Id,
            QuestionId = answer.QuestionId,
            UserAnswer = answer.UserAnswer,
            Score = answer.Score,
            Feedback = answer.Feedback,
            AnsweredAt = answer.AnsweredAt
        };
    }

    /// <summary>
    /// Belirli bir session için sonuç analizi üretir.
    /// Skor, güçlü alanlar, gelişim alanları, öneriler ve soru-cevap detaylarını döndürür.
    /// </summary>
    public async Task<InterviewResultDto?> GetInterviewResultAsync(int userId, int sessionId)
    {
        var session = await _context.InterviewSessions
            .Include(s => s.Position)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

        if (session is null)
        {
            return null;
        }

        var answeredQuestions = session.Questions
            .Count(q => q.Answer is not null);

        var scores = session.Questions
            .Where(q => q.Answer is not null && q.Answer.Score.HasValue)
            .Select(q => q.Answer!.Score!.Value)
            .ToList();

        int? averageScore = scores.Any()
            ? Convert.ToInt32(scores.Average())
            : null;

        var strongAreas = GetStrongAreas(session.Questions.ToList());
        var improvementAreas = GetImprovementAreas(session.Questions.ToList());
        var studyRecommendations = GetStudyRecommendations(improvementAreas);
        var generalEvaluation = GenerateGeneralEvaluation(
            averageScore,
            answeredQuestions,
            session.Questions.Count);
        var categoryPerformances = GetCategoryPerformances(session.Questions.ToList());

        session.TotalScore = averageScore;

        if (answeredQuestions == session.Questions.Count && session.CompletedAt is null)
        {
            session.CompletedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        return new InterviewResultDto
        {
            SessionId = session.Id,
            PositionName = session.Position.Name,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            TotalQuestions = session.Questions.Count,
            AnsweredQuestions = answeredQuestions,
            AverageScore = averageScore,
            ImprovementAreas = improvementAreas,
            StudyRecommendations = studyRecommendations,
            GeneralEvaluation = generalEvaluation,
            CategoryPerformances = categoryPerformances,
            Questions = session.Questions
                .OrderBy(q => q.Id)
                .Select(q => new InterviewResultQuestionDto
                {
                    QuestionId = q.Id,
                    QuestionText = q.QuestionText,
                    Difficulty = q.Difficulty,
                    Category = q.Category,
                    UserAnswer = q.Answer?.UserAnswer,
                    Score = q.Answer?.Score,
                    Feedback = q.Answer?.Feedback,
                    AnsweredAt = q.Answer?.AnsweredAt,
                    BetterAnswerExample = GenerateBetterAnswerExample(
                        q.QuestionText, 
                        q.Category, 
                        q.Difficulty)
                }).ToList()
        };
    }

    /// <summary>
    /// Kullanıcının tüm mülakat session'larını listeler.
    /// My Sessions sayfası bu metodu kullanır.
    /// </summary>
    public async Task<List<MyInterviewSessionDto>> GetMySessionsAsync(int userId)
    {
        var sessions = await _context.InterviewSessions
            .Include(s => s.Position)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new MyInterviewSessionDto
            {
                Id = s.Id,
                PositionName = s.Position.Name,
                StartedAt = s.StartedAt,
                CompletedAt = s.CompletedAt,
                TotalScore = s.TotalScore,
                TotalQuestions = s.Questions.Count,
                AnsweredQuestions = s.Questions.Count(q => q.Answer != null),
                Status = s.CompletedAt == null ? "In Progress" : "Completed"
            })
            .ToListAsync();

        return sessions;
    }

    /// <summary>
    /// CV metninden skill/teknoloji tespiti yapar.
    /// Bu şimdilik keyword-based çalışır.
    /// İleride buraya gerçek AI veya NLP tabanlı analiz ekleyebiliriz.
    /// </summary>
    private List<string> DetectSkillsFromText(string text)
    {
        var normalizedText = text.ToLower();

        var skillKeywords = new Dictionary<string, string[]>
        {
            { "C#", new[] { "c#", "c sharp", "csharp" } },
            { "ASP.NET Core", new[] { "asp.net core", ".net core", "aspnet core" } },
            { "SQL", new[] { "sql", "sql server", "mysql", "sqlite", "postgresql" } },
            { "Python", new[] { "python" } },
            { "JavaScript", new[] { "javascript", "js" } },
            { "TypeScript", new[] { "typescript", "ts" } },
            { "HTML", new[] { "html", "html5" } },
            { "CSS", new[] { "css", "css3" } },
            { "React", new[] { "react", "react.js", "reactjs" } },
            { "Next.js", new[] { "next.js", "nextjs", "next js" } },
            { "Entity Framework", new[] { "entity framework", "ef core", "entity framework core" } },
            { "REST API", new[] { "rest api", "restful", "api" } },
            { "JWT", new[] { "jwt", "json web token" } },
            { "Git", new[] { "git", "github", "gitlab" } },
            { "Docker", new[] { "docker", "container" } },
            { "Power BI", new[] { "power bi", "powerbi" } },
            { "Pandas", new[] { "pandas" } },
            { "NumPy", new[] { "numpy" } },
            { "OpenCV", new[] { "opencv", "open cv" } },
            { "Machine Learning", new[] { "machine learning", "makine öğrenmesi", "ml" } },
            { "Data Analysis", new[] { "data analysis", "veri analizi", "data analytics" } },
            { "Agile", new[] { "agile", "scrum", "kanban" } },
            { "Kotlin", new[] { "kotlin" } },
            { "Android", new[] { "android", "android studio" } },
            { "MVC", new[] { "mvc", "model view controller" } }
        };

        var detectedSkills = new List<string>();

        foreach (var skill in skillKeywords)
        {
            var isDetected = skill.Value.Any(keyword =>
                normalizedText.Contains(keyword.ToLower()));

            if (isDetected)
            {
                detectedSkills.Add(skill.Key);
            }
        }

        return detectedSkills
            .Distinct()
            .OrderBy(x => x)
            .ToList();
    }

    /// <summary>
    /// Cevabı puanlar.
    /// Şu an rule-based çalışır:
    /// - cevap uzunluğu
    /// - beklenen keyword kullanımı
    /// - örnek/proje ifadesi var mı
    /// - "bilmiyorum" tarzı cevap mı
    /// İleride GPT/Gemini değerlendirmesi buraya veya ayrı bir AI evaluator servisine bağlanabilir.
    /// </summary>
    private int CalculateSmartScore(
        string userAnswer,
        string category,
        string questionText)
    {
        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return 0;
        }

        if (IsUnknownAnswer(userAnswer))
        {
            return 10;
        }

        var normalizedAnswer = userAnswer.ToLower();
        var normalizedCategory = category.ToLower();
        var normalizedQuestion = questionText.ToLower();

        // SQL Practice cevapları için özel puanlama yapıyoruz.
        // Çünkü SQL cevabı normal paragraf gibi değil, sorgu yapısı üzerinden değerlendirilir.
        if (normalizedCategory.Contains("sql"))
        {
            return CalculateSqlAnswerScore(
                normalizedAnswer,
                normalizedQuestion);
        }

        // Coding Practice cevapları için özel puanlama yapıyoruz.
        // Çünkü kod cevaplarında function/metot, return, koşul/döngü gibi yapılar önemlidir.
        if (normalizedCategory.Contains("coding practice"))
        {
            return CalculateCodingAnswerScore(
                normalizedAnswer,
                normalizedQuestion,
                normalizedCategory);
        }

        var score = 30;

        if (userAnswer.Length >= 50)
        {
            score += 20;
        }

        if (userAnswer.Length >= 150)
        {
            score += 15;
        }

        var expectedKeywords = GetExpectedKeywords(normalizedCategory, normalizedQuestion);

        var matchedKeywordCount = expectedKeywords
            .Count(keyword => normalizedAnswer.Contains(keyword));

        if (matchedKeywordCount >= 1)
        {
            score += 15;
        }

        if (matchedKeywordCount >= 3)
        {
            score += 15;
        }

        if (ContainsExampleExpression(normalizedAnswer))
        {
            score += 5;
        }

        return Math.Min(score, 100);
    }

    /// <summary>
    /// SQL Practice cevaplarını daha mantıklı puanlar.
    /// SELECT, FROM, WHERE, JOIN, GROUP BY gibi SQL yapılarının kullanımına bakar.
    /// </summary>
    private int CalculateSqlAnswerScore(
        string normalizedAnswer,
        string normalizedQuestion)
    {
        var score = 20;

        if (normalizedAnswer.Contains("select"))
        {
            score += 20;
        }

        if (normalizedAnswer.Contains("from"))
        {
            score += 20;
        }

        if (normalizedQuestion.Contains("where") &&
            normalizedAnswer.Contains("where"))
        {
            score += 15;
        }

        if ((normalizedQuestion.Contains("join") ||
             normalizedQuestion.Contains("inner join") ||
             normalizedQuestion.Contains("left join")) &&
            normalizedAnswer.Contains("join"))
        {
            score += 15;
        }

        if (normalizedQuestion.Contains("group by") &&
            normalizedAnswer.Contains("group by"))
        {
            score += 15;
        }

        if (normalizedQuestion.Contains("having") &&
            normalizedAnswer.Contains("having"))
        {
            score += 10;
        }

        if (normalizedQuestion.Contains("order by") &&
            normalizedAnswer.Contains("order by"))
        {
            score += 10;
        }

        if (normalizedQuestion.Contains("count") &&
            normalizedAnswer.Contains("count"))
        {
            score += 10;
        }

        if (normalizedQuestion.Contains("null") &&
            (normalizedAnswer.Contains("is null") ||
             normalizedAnswer.Contains("is not null")))
        {
            score += 10;
        }

        if (normalizedAnswer.Contains(";"))
        {
            score += 5;
        }

        return Math.Min(score, 100);
    }

    /// <summary>
    /// Coding Practice cevaplarını daha mantıklı puanlar.
    /// Dil farkına göre temel kod yapılarını kontrol eder.
    /// </summary>
    private int CalculateCodingAnswerScore(
        string normalizedAnswer,
        string normalizedQuestion,
        string normalizedCategory)
    {
        var score = 20;

        // C# cevabı için temel yapılar
        if (normalizedCategory.Contains("c#"))
        {
            if (normalizedAnswer.Contains("public") ||
                normalizedAnswer.Contains("private") ||
                normalizedAnswer.Contains("static"))
            {
                score += 15;
            }

            if (normalizedAnswer.Contains("return"))
            {
                score += 20;
            }

            if (normalizedAnswer.Contains("(") &&
                normalizedAnswer.Contains(")"))
            {
                score += 10;
            }

            if (normalizedAnswer.Contains("{") &&
                normalizedAnswer.Contains("}"))
            {
                score += 10;
            }
        }

        // Python cevabı için temel yapılar
        else if (normalizedCategory.Contains("python"))
        {
            if (normalizedAnswer.Contains("def "))
            {
                score += 25;
            }

            if (normalizedAnswer.Contains("return"))
            {
                score += 20;
            }

            if (normalizedAnswer.Contains(":"))
            {
                score += 10;
            }
        }

        // JavaScript cevabı için temel yapılar
        else if (normalizedCategory.Contains("javascript"))
        {
            if (normalizedAnswer.Contains("function") ||
                normalizedAnswer.Contains("=>"))
            {
                score += 25;
            }

            if (normalizedAnswer.Contains("return"))
            {
                score += 20;
            }

            if (normalizedAnswer.Contains("{") &&
                normalizedAnswer.Contains("}"))
            {
                score += 10;
            }
        }

        // Genel algoritma işaretleri
        if (normalizedAnswer.Contains("for") ||
            normalizedAnswer.Contains("foreach") ||
            normalizedAnswer.Contains("while"))
        {
            score += 15;
        }

        if (normalizedAnswer.Contains("if"))
        {
            score += 10;
        }

        if (normalizedAnswer.Contains("max") ||
            normalizedAnswer.Contains("min") ||
            normalizedAnswer.Contains("sum") ||
            normalizedAnswer.Contains("count") ||
            normalizedAnswer.Contains("length"))
        {
            score += 10;
        }

        // Soru palindrome ise cevapta ters çevirme/kıyaslama mantığı beklenir.
        if (normalizedQuestion.Contains("palindrome") &&
            (normalizedAnswer.Contains("reverse") ||
             normalizedAnswer.Contains("[::-1]") ||
             normalizedAnswer.Contains("sequenceequal")))
        {
            score += 15;
        }

        // Soru tekrar/frekans içeriyorsa dictionary/object mantığı beklenir.
        if ((normalizedQuestion.Contains("tekrar") ||
             normalizedQuestion.Contains("frekans")) &&
            (normalizedAnswer.Contains("dictionary") ||
             normalizedAnswer.Contains("dict") ||
             normalizedAnswer.Contains("object") ||
             normalizedAnswer.Contains("map")))
        {
            score += 15;
        }

        return Math.Min(score, 100);
    }

    /// <summary>
    /// Kullanıcı cevabına açıklayıcı feedback üretir.
    /// Şu an keyword ve uzunluk bazlı çalışır.
    /// </summary>
    private string GenerateSmartFeedback(
        string userAnswer,
        string category,
        string questionText)
    {
        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return "Cevap boş bırakılmış. Soruyu teknik kavramlarla açıklamaya çalışmalısın.";
        }

        if (IsUnknownAnswer(userAnswer))
        {
            return "Bu cevap, sorunun teknik içeriğini açıklamadığı için düşük puanlandı. Konuyu bilmiyorsan bile temel tanım, kullanım amacı ve kısa bir örnek üzerinden cevap vermeye çalışmalısın.";
        }

        var normalizedAnswer = userAnswer.ToLower();
        var normalizedCategory = category.ToLower();
        var normalizedQuestion = questionText.ToLower();

        if (normalizedCategory.Contains("sql"))
        {
            return GenerateSqlAnswerFeedback(
                normalizedAnswer,
                normalizedQuestion);
        }

        if (normalizedCategory.Contains("coding practice"))
        {
            return GenerateCodingAnswerFeedback(
                normalizedAnswer,
                normalizedQuestion,
                normalizedCategory);
        }

        var expectedKeywords = GetExpectedKeywords(normalizedCategory, normalizedQuestion);

        var matchedKeywords = expectedKeywords
            .Where(keyword => normalizedAnswer.Contains(keyword))
            .ToList();

        if (userAnswer.Length < 50)
        {
            return "Cevap çok kısa. Daha açıklayıcı olmalı ve teknik kavramlarla desteklenmeli.";
        }

        if (!matchedKeywords.Any())
        {
            return "Cevap uzunluk olarak yeterli olabilir ancak ilgili teknik kavramları yeterince içermiyor. Soruyla ilişkili anahtar kavramları eklemelisin.";
        }

        if (matchedKeywords.Count < 3)
        {
            return $"Cevap temel olarak uygun. Ancak daha güçlü olması için şu kavramları daha detaylı açıklayabilirsin: {string.Join(", ", expectedKeywords.Take(3))}.";
        }

        if (!ContainsExampleExpression(normalizedAnswer))
        {
            return "Cevap teknik olarak iyi görünüyor. Daha güçlü olması için kısa bir örnek veya proje deneyimiyle destekleyebilirsin.";
        }

        return "Cevap teknik kavramlar içeriyor, yeterince açıklayıcı ve örnekle desteklenmiş görünüyor.";
    }

    /// <summary>
    /// SQL cevapları için daha özel feedback üretir.
    /// </summary>
    private string GenerateSqlAnswerFeedback(
        string normalizedAnswer,
        string normalizedQuestion)
    {
        if (!normalizedAnswer.Contains("select"))
        {
            return "SQL cevabında SELECT ifadesi eksik görünüyor. Sorgunun hangi alanları getireceğini belirtmelisin.";
        }

        if (!normalizedAnswer.Contains("from"))
        {
            return "SQL cevabında FROM ifadesi eksik görünüyor. Verinin hangi tablodan geleceğini belirtmelisin.";
        }

        if (normalizedQuestion.Contains("join") &&
            !normalizedAnswer.Contains("join"))
        {
            return "Bu soru JOIN kullanımı gerektiriyor. İlgili tabloları INNER JOIN veya LEFT JOIN ile bağlamalısın.";
        }

        if (normalizedQuestion.Contains("group by") &&
            !normalizedAnswer.Contains("group by"))
        {
            return "Bu soru gruplama gerektiriyor. GROUP BY kullanarak verileri ilgili alana göre gruplamalısın.";
        }

        if (normalizedQuestion.Contains("having") &&
            !normalizedAnswer.Contains("having"))
        {
            return "Bu soru HAVING koşulu gerektiriyor. Aggregate sonuçlar üzerinde filtreleme yapmak için HAVING kullanmalısın.";
        }

        return "SQL cevabın temel sorgu yapısını içeriyor. Daha güçlü olması için tablo/kolon adlarını netleştirip sorgunun ne yaptığını kısa bir cümleyle açıklayabilirsin.";
    }

    /// <summary>
    /// Kodlama cevapları için daha özel feedback üretir.
    /// </summary>
    private string GenerateCodingAnswerFeedback(
        string normalizedAnswer,
        string normalizedQuestion,
        string normalizedCategory)
    {
        if (normalizedCategory.Contains("python") &&
            !normalizedAnswer.Contains("def "))
        {
            return "Python cevabında fonksiyon tanımı eksik görünüyor. Cevabını def ile başlayan bir fonksiyon şeklinde yazman daha doğru olur.";
        }

        if (normalizedCategory.Contains("javascript") &&
            !normalizedAnswer.Contains("function") &&
            !normalizedAnswer.Contains("=>"))
        {
            return "JavaScript cevabında fonksiyon yapısı eksik görünüyor. function veya arrow function kullanarak çözümü fonksiyon haline getirebilirsin.";
        }

        if (normalizedCategory.Contains("c#") &&
            !normalizedAnswer.Contains("return"))
        {
            return "C# cevabında return ifadesi eksik görünüyor. Metodun sonucu nasıl döndürdüğünü göstermelisin.";
        }

        if (!normalizedAnswer.Contains("return"))
        {
            return "Kod cevabında return ifadesi eksik görünüyor. Fonksiyonun hangi sonucu döndürdüğünü net göstermelisin.";
        }

        if ((normalizedQuestion.Contains("liste") ||
             normalizedQuestion.Contains("dizi")) &&
            !normalizedAnswer.Contains("for") &&
            !normalizedAnswer.Contains("foreach") &&
            !normalizedAnswer.Contains("while") &&
            !normalizedAnswer.Contains("map") &&
            !normalizedAnswer.Contains("filter"))
        {
            return "Bu soru liste/dizi üzerinde işlem yapmayı gerektiriyor. Döngü, map, filter veya benzeri bir yapı kullanman beklenir.";
        }

        return "Kod cevabın temel çözüm yapısını içeriyor. Daha güçlü olması için edge case durumlarını, null/boş liste kontrolünü ve algoritmanın neden doğru çalıştığını kısa bir notla açıklayabilirsin.";
    }

    /// <summary>
    /// Her soru için daha güçlü bir cevap örneği üretir.
    /// Şimdilik rule-based çalışır.
    /// İleride GPT/Gemini API entegrasyonunda bu metot gerçek AI cevabı dönecek şekilde geliştirilebilir.
    /// </summary>
    private string GenerateBetterAnswerExample(
        string questionText,
        string category,
        string difficulty)
    {
        var normalizedQuestion = questionText.ToLower();
        var normalizedCategory = category.ToLower();

        if (normalizedCategory.Contains("behavioral"))
        {
            return "Bu soruya STAR tekniğiyle cevap verebilirsin: Önce durumu kısaca anlat, sonra görevini açıkla, hangi aksiyonları aldığını söyle ve sonucu net bir şekilde belirt. Örneğin: 'Bir projede zaman baskısı yaşadığımızda önce öncelikleri belirledim, ekip ile görev dağılımı yaptım ve süreci takip ederek işi zamanında tamamladık.'";
        }

        if (normalizedCategory.Contains("cv-based"))
        {
            return "Bu soruda CV'ndeki bir projeyi somut şekilde anlatman güçlü olur. Projenin amacını, kullandığın teknolojileri, senin sorumluluğunu, karşılaştığın problemi ve elde ettiğin sonucu açıklayabilirsin.";
        }

        if (normalizedCategory.Contains("technical") ||
            normalizedCategory.Contains("api") ||
            normalizedQuestion.Contains("api") ||
            normalizedQuestion.Contains("rest"))
        {
            return "Teknik sorularda önce kavramın kısa tanımını yap, sonra nerede kullanıldığını açıkla ve küçük bir örnek ver. Örneğin API için: 'API, iki sistemin birbiriyle veri alışverişi yapmasını sağlayan arayüzdür. Web uygulamalarında frontend backend'e HTTP istekleri göndererek veri alır veya veri kaydeder.'";
        }

        if (normalizedQuestion.Contains("jwt") ||
            normalizedQuestion.Contains("authentication") ||
            normalizedCategory.Contains("security"))
        {
            return "JWT sorularında login sonrası token üretimi, token'ın client tarafında saklanması, sonraki isteklerde Authorization header ile gönderilmesi ve backend'in token'ı doğrulaması adımlarını açıklayabilirsin.";
        }

        if (normalizedQuestion.Contains("sql") ||
            normalizedQuestion.Contains("join") ||
            normalizedCategory.Contains("sql") ||
            normalizedCategory.Contains("database"))
        {
            return "SQL sorularında cevabını güçlendirmek için önce kavramı kısa tanımla, sonra küçük bir örnek sorgu yaz. Örneğin JOIN sorusunda INNER JOIN'in sadece eşleşen kayıtları, LEFT JOIN'in ise sol tablodaki tüm kayıtları getirdiğini açıklayıp örnek bir SELECT sorgusu verebilirsin.";
        }

        if (normalizedQuestion.Contains("controller") ||
            normalizedQuestion.Contains("service") ||
            normalizedQuestion.Contains("repository"))
        {
            return "Controller-Service-Repository sorusunda katmanların sorumluluklarını ayırarak anlatabilirsin. Controller isteği karşılar, Service iş kurallarını yönetir, Repository veritabanı işlemlerini yapar. Bu yapı kodun daha okunabilir ve sürdürülebilir olmasını sağlar.";
        }

        if (normalizedQuestion.Contains("requirement") ||
            normalizedQuestion.Contains("user story") ||
            normalizedQuestion.Contains("acceptance criteria"))
        {
            return "İş analizi sorularında kavramı tanımlayıp örnekle desteklemek güçlü olur. Örneğin requirement için: 'Requirement, kullanıcının veya iş biriminin sistemden beklediği ihtiyaçtır. Bu ihtiyaç netleştirildikten sonra user story ve acceptance criteria ile geliştirilebilir hale getirilir.'";
        }

        return "Bu soruya daha güçlü cevap vermek için önce kavramı kısa ve net tanımla, ardından kendi proje veya deneyiminden bir örnek ver. Cevabının sonunda bu deneyimin sana ne öğrettiğini veya işe nasıl katkı sağlayacağını belirt.";
    }

    /// <summary>
    /// Soru kategorisine/metnine göre cevapta beklenen anahtar kavramları belirler.
    /// </summary>
    private List<string> GetExpectedKeywords(
        string normalizedCategory,
        string normalizedQuestion)
    {
        if (normalizedCategory.Contains("api") ||
            normalizedQuestion.Contains("api") ||
            normalizedQuestion.Contains("rest"))
        {
            return new List<string>
            {
                "api",
                "rest",
                "endpoint",
                "request",
                "response",
                "istek",
                "cevap",
                "http",
                "get",
                "post",
                "json"
            };
        }

        if (normalizedCategory.Contains("security") ||
            normalizedQuestion.Contains("jwt") ||
            normalizedQuestion.Contains("authentication"))
        {
            return new List<string>
            {
                "jwt",
                "token",
                "authentication",
                "authorization",
                "kimlik doğrulama",
                "yetkilendirme",
                "claim",
                "security",
                "login"
            };
        }

        if (normalizedCategory.Contains("database") ||
            normalizedCategory.Contains("sql") ||
            normalizedQuestion.Contains("sql") ||
            normalizedQuestion.Contains("join"))
        {
            return new List<string>
            {
                "sql",
                "database",
                "veritabanı",
                "tablo",
                "table",
                "join",
                "inner join",
                "left join",
                "primary key",
                "foreign key",
                "query"
            };
        }

        if (normalizedCategory.Contains("backend") ||
            normalizedQuestion.Contains("controller") ||
            normalizedQuestion.Contains("service") ||
            normalizedQuestion.Contains("repository"))
        {
            return new List<string>
            {
                "controller",
                "service",
                "repository",
                "katman",
                "layer",
                "business",
                "data",
                "dependency injection",
                "entity"
            };
        }

        if (normalizedCategory.Contains("cv-based") &&
            normalizedQuestion.Contains("opencv"))
        {
            return new List<string>
            {
                "opencv",
                "grayscale",
                "threshold",
                "contour",
                "image",
                "pixel",
                "blur",
                "detection"
            };
        }

        if (normalizedCategory.Contains("cv-based") &&
            normalizedQuestion.Contains("python"))
        {
            return new List<string>
            {
                "python",
                "pandas",
                "numpy",
                "data",
                "analysis",
                "library",
                "visualization"
            };
        }

        if (normalizedCategory.Contains("behavioral"))
        {
            return new List<string>
            {
                "problem",
                "research",
                "learn",
                "öğren",
                "takım",
                "team",
                "çözüm",
                "solution",
                "iletişim",
                "communication",
                "proje",
                "project"
            };
        }

        return new List<string>
        {
            "project",
            "proje",
            "system",
            "sistem",
            "process",
            "süreç",
            "data",
            "veri",
            "user",
            "kullanıcı",
            "technology",
            "teknoloji",
            "example",
            "örnek"
        };
    }

    /// <summary>
    /// Cevapta örnek/proje deneyimi ifadesi var mı kontrol eder.
    /// </summary>
    private bool ContainsExampleExpression(string normalizedAnswer)
    {
        var exampleExpressions = new List<string>
        {
            "örneğin",
            "mesela",
            "example",
            "for example",
            "projemde",
            "projede",
            "kullandım",
            "uyguladım",
            "senaryo"
        };

        return exampleExpressions.Any(expression =>
            normalizedAnswer.Contains(expression));
    }

    /// <summary>
    /// Skoru 75 ve üzeri olan kategorileri güçlü alan olarak döndürür.
    /// </summary>
    private List<string> GetStrongAreas(List<Question> questions)
    {
        var strongAreas = questions
            .Where(q => q.Answer is not null &&
                        q.Answer.Score.HasValue &&
                        q.Answer.Score.Value >= 75)
            .GroupBy(q => q.Category)
            .Select(g => g.Key)
            .Distinct()
            .ToList();

        if (!strongAreas.Any())
        {
            return new List<string>
            {
                "Henüz belirgin bir güçlü alan tespit edilemedi."
            };
        }

        return strongAreas;
    }

    /// <summary>
    /// Skoru 60 altı olan veya cevaplanmamış kategorileri gelişim alanı olarak döndürür.
    /// </summary>
    private List<string> GetImprovementAreas(List<Question> questions)
    {
        var improvementAreas = questions
            .Where(q => q.Answer is null ||
                        !q.Answer.Score.HasValue ||
                        q.Answer.Score.Value < 60)
            .GroupBy(q => q.Category)
            .Select(g => g.Key)
            .Distinct()
            .ToList();

        if (!improvementAreas.Any())
        {
            return new List<string>
            {
                "Genel performans iyi görünüyor. Kritik bir geliştirme alanı tespit edilmedi."
            };
        }

        return improvementAreas;
    }

    /// <summary>
    /// Geliştirilmesi gereken alanlara göre çalışma önerileri üretir.
    /// </summary>
    private List<string> GetStudyRecommendations(List<string> improvementAreas)
    {
        var recommendations = new List<string>();

        foreach (var area in improvementAreas)
        {
            var normalizedArea = area.ToLower();

            if (normalizedArea.Contains("api") ||
                normalizedArea.Contains("backend") ||
                normalizedArea.Contains("technical"))
            {
                recommendations.Add("REST API, HTTP metotları, request-response yapısı ve endpoint tasarımı konularını tekrar etmelisin.");
            }
            else if (normalizedArea.Contains("security"))
            {
                recommendations.Add("JWT, authentication, authorization, claim ve token doğrulama konularını çalışmalısın.");
            }
            else if (normalizedArea.Contains("database") ||
                     normalizedArea.Contains("sql"))
            {
                recommendations.Add("SQL JOIN türleri, primary key, foreign key, index ve temel sorgu yazımı konularını tekrar etmelisin.");
            }
            else if (normalizedArea.Contains("cv-based"))
            {
                recommendations.Add("CV'nde yer verdiğin teknolojileri proje deneyiminle birlikte daha net açıklamaya çalışmalısın.");
            }
            else if (normalizedArea.Contains("behavioral"))
            {
                recommendations.Add("Davranışsal sorular için STAR tekniğiyle durum, görev, aksiyon ve sonuç şeklinde cevap verme pratiği yapmalısın.");
            }
            else if (normalizedArea.Contains("data") ||
                     normalizedArea.Contains("statistics") ||
                     normalizedArea.Contains("eda"))
            {
                recommendations.Add("Veri analizi, eksik veri, aykırı değer, temel istatistik ve görselleştirme konularını tekrar etmelisin.");
            }
            else
            {
                recommendations.Add($"{area} alanında temel kavramları tekrar edip örnek cevaplar hazırlamalısın.");
            }
        }

        return recommendations
            .Distinct()
            .ToList();
    }

    /// <summary>
    /// Ortalama skora ve cevaplanan soru sayısına göre genel değerlendirme üretir.
    /// </summary>
    private string GenerateGeneralEvaluation(
        int? averageScore,
        int answeredQuestions,
        int totalQuestions)
    {
        if (answeredQuestions == 0)
        {
            return "Henüz cevap verilmediği için genel değerlendirme oluşturulamadı.";
        }

        if (answeredQuestions < totalQuestions)
        {
            return "Mülakatın bir kısmı cevaplanmış. Daha doğru bir değerlendirme için tüm soruları cevaplamalısın.";
        }

        if (!averageScore.HasValue)
        {
            return "Skor hesaplanamadığı için genel değerlendirme oluşturulamadı.";
        }

        if (averageScore.Value >= 85)
        {
            return "Genel performans oldukça güçlü. Teknik kavramları açıklama ve örnekle destekleme açısından iyi bir seviyedesin.";
        }

        if (averageScore.Value >= 70)
        {
            return "Genel performans iyi. Bazı cevapları daha fazla teknik detay ve proje örneğiyle güçlendirebilirsin.";
        }

        if (averageScore.Value >= 50)
        {
            return "Genel performans orta seviyede. Temel kavramları biliyorsun ancak cevaplarını daha açıklayıcı ve teknik hale getirmen gerekiyor.";
        }

        return "Genel performans geliştirmeye açık. Öncelikle temel kavramları tekrar edip kısa ama net örnek cevaplar hazırlaman önerilir.";
    }

    /// <summary>
    /// Kategori bazlı performansı hesaplar.
    /// Örneğin Behavioral kategorisinde kaç soru var, kaçı cevaplanmış, ortalama skor kaç?
    /// </summary>
    private List<CategoryPerformanceDto> GetCategoryPerformances(List<Question> questions)
    {
        var categoryPerformances = questions
            .GroupBy(q => q.Category)
            .Select(group =>
            {
                var answeredQuestions = group
                    .Where(q => q.Answer is not null && q.Answer.Score.HasValue)
                    .ToList();

                int? averageScore = answeredQuestions.Any()
                    ? Convert.ToInt32(answeredQuestions.Average(q => q.Answer!.Score!.Value))
                    : null;

                return new CategoryPerformanceDto
                {
                    Category = group.Key,
                    QuestionCount = group.Count(),
                    AnsweredQuestionCount = answeredQuestions.Count,
                    AverageScore = averageScore
                };
            })
            .OrderBy(x => x.Category)
            .ToList();

        return categoryPerformances;
    }

    /// <summary>
    /// Cevap gerçekten teknik cevap mı,
    /// yoksa "bilmiyorum" tarzı kaçınma cevabı mı, bunu tespit eder.
    /// </summary>
    private bool IsUnknownAnswer(string userAnswer)
    {
        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return true;
        }

        var normalizedAnswer = userAnswer.ToLower().Trim();

        var unknownExpressions = new List<string>
        {
            "bilmiyorum",
            "bilmiyorum.",
            "bu sorunun cevabını bilmiyorum",
            "cevabını bilmiyorum",
            "fikrim yok",
            "bir fikrim yok",
            "emin değilim",
            "bunu bilmiyorum",
            "bu konuda bilgim yok",
            "bu konu hakkında bilgim yok",
            "şu anda bilmiyorum",
            "şuan bilmiyorum",
            "şu an bilmiyorum",
            "söylemek istemem",
            "bir şey söylemek istemem",
            "yorum yapamam",
            "cevaplamak istemiyorum",
            "pas geçiyorum",
            "pas",
            "i don't know",
            "i dont know",
            "i do not know",
            "no idea",
            "not sure"
        };

        return unknownExpressions.Any(expression =>
            normalizedAnswer.Contains(expression));
    }

    /// <summary>
    /// Soru üretirken kullandığımız geçici model.
    /// Veritabanına kaydedilmez; sadece Question entity'sine dönüştürmeden önce kullanılır.
    /// </summary>
    private class GeneratedQuestion
    {
        public string Text { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Difficulty { get; set; } = "Intermediate";
    }
}
