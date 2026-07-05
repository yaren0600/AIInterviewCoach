using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Domain.Entities;
using AIInterviewCoach.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AIInterviewCoach.Infrastructure.Services;

public class InterviewService : IInterviewService
{
    private readonly AppDbContext _context;

    public InterviewService(AppDbContext context)
    {
        _context = context;
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
            _ => "mixed"
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
                Text = $"What makes you a good candidate for the {positionName} role?",
                Category = "Role-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Can you explain a project you are proud of and what you learned from it?",
                Category = "CV-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "How do you approach solving a problem when you do not know the solution at first?",
                Category = "Problem Solving",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Can you describe how you would communicate a technical topic to a non-technical stakeholder?",
                Category = "Communication",
                Difficulty = difficulty
            },
            new()
            {
                Text = "What would you do if project requirements changed close to the deadline?",
                Category = "Behavioral",
                Difficulty = difficulty
            },
            new()
            {
                Text = "How do you organize your work when you have multiple tasks with different priorities?",
                Category = "Behavioral",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Can you explain how you test or validate that your work is correct?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "What is one technical topic you want to improve, and how are you planning to improve it?",
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
                    Text = $"Can you explain why you are interested in the {positionName} position?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"What are the main responsibilities of a {positionName}?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"Which skills do you think are most important for a {positionName}?",
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
                    Text = $"How would you handle a complex real-world problem in a {positionName} role?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"How would you prioritize tasks when multiple stakeholders expect different outcomes in a {positionName} role?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"How would you measure your success as a {positionName} in the first three months?",
                    Category = "Role-Based",
                    Difficulty = difficulty
                }
            };
        }

        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = $"How would your background help you succeed as a {positionName}?",
                Category = "Role-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = $"Can you describe a project or experience that is relevant to the {positionName} position?",
                Category = "Role-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = $"What challenges do you expect in a {positionName} role, and how would you handle them?",
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
                    Text = "Can you describe one project from your background and explain your role in it?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Which technical skill in your background do you feel most confident about?",
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
                    Text = "Can you explain one project from your resume in simple terms?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Which technology from your resume did you use most actively?",
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
                    Text = "Choose one project from your resume and explain its architecture, technical decisions, and limitations.",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "What would you improve in one of the projects listed on your resume if you rebuilt it today?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "Can you defend the technology choices you made in one of your resume projects?",
                    Category = "CV-Based",
                    Difficulty = difficulty
                }
            };
        }

        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "Can you explain one project from your resume and describe your main responsibilities?",
                Category = "CV-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "Which technical challenge did you face in a project from your resume, and how did you solve it?",
                Category = "CV-Based",
                Difficulty = difficulty
            },
            new()
            {
                Text = "How did your resume projects help you improve your problem-solving skills?",
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
                Text = "Your resume includes ASP.NET Core. How did you structure controller, service, and repository layers in one of your projects?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("SQL"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes SQL. Can you explain INNER JOIN and LEFT JOIN with a project-related example?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Python"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes Python. Which libraries did you use for data processing or analysis, and why?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("OpenCV"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes OpenCV. Why did you use grayscale, threshold, or contour operations in your image processing project?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Power BI"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes Power BI. How do you choose metrics and visualizations when designing a dashboard?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("JWT"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes JWT. Can you explain token creation and validation in JWT-based authentication?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Docker"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes Docker. What are the advantages of containerizing an application?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Kotlin") || detectedSkills.Contains("Android"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes Android/Kotlin. How did you manage user input and data processing in an Android application?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Machine Learning"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes Machine Learning. Which metrics would you use to evaluate a model?",
                Category = "CV-Based",
                Difficulty = difficulty
            });
        }

        if (detectedSkills.Contains("Git"))
        {
            questions.Add(new GeneratedQuestion
            {
                Text = "Your resume includes Git/GitHub. How do you manage branch, commit, and pull request processes in teamwork?",
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
                    Text = "What is an API, and why is it used in software applications?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "What is the difference between frontend and backend?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "What is a database, and why do applications need one?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "What is Git used for in software development?",
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
                    Text = "How would you design a scalable backend architecture for an interview preparation platform?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "How would you improve API performance if response times became slow?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = "How would you handle authentication and authorization securely in a web application?",
                    Category = "Technical",
                    Difficulty = difficulty
                },
                new()
                {
                    Text = $"What technical risks would you consider before starting a {positionName} project?",
                    Category = "Technical",
                    Difficulty = difficulty
                }
            };
        }

        return new List<GeneratedQuestion>
        {
            new()
            {
                Text = "Can you explain the controller-service-repository pattern?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "What is the purpose of JWT authentication?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "What is the difference between INNER JOIN and LEFT JOIN in SQL?",
                Category = "Technical",
                Difficulty = difficulty
            },
            new()
            {
                Text = "What is dependency injection and why is it useful?",
                Category = "Technical",
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
            .FirstOrDefaultAsync(q =>
                q.Id == request.QuestionId &&
                q.InterviewSession.UserId == userId);

        if (question is null)
        {
            return null;
        }

        var existingAnswer = await _context.Answers
            .FirstOrDefaultAsync(a => a.QuestionId == request.QuestionId);

        if (existingAnswer is not null)
        {
            existingAnswer.UserAnswer = request.UserAnswer;
            existingAnswer.Score = CalculateSmartScore(request.UserAnswer, question.Category, question.QuestionText);
            existingAnswer.Feedback = GenerateSmartFeedback(request.UserAnswer, question.Category, question.QuestionText);
            existingAnswer.AnsweredAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return new AnswerDto
            {
                Id = existingAnswer.Id,
                QuestionId = existingAnswer.QuestionId,
                UserAnswer = existingAnswer.UserAnswer,
                Score = existingAnswer.Score,
                Feedback = existingAnswer.Feedback,
                AnsweredAt = existingAnswer.AnsweredAt
            };
        }

        var answer = new Answer
        {
            QuestionId = request.QuestionId,
            UserAnswer = request.UserAnswer,
            Score = CalculateSmartScore(request.UserAnswer, question.Category, question.QuestionText),
            Feedback = GenerateSmartFeedback(request.UserAnswer, question.Category, question.QuestionText),
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
                    AnsweredAt = q.Answer?.AnsweredAt
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
                "team",
                "solution",
                "communication",
                "project"
            };
        }

        return new List<string>
        {
            "project",
            "system",
            "process",
            "data",
            "user",
            "technology",
            "example"
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
