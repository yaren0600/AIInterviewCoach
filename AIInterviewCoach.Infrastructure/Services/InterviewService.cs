using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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

    public async Task<InterviewSessionDto?> StartInterviewAsync(int userId, StartInterviewRequestDto request)
    {
        var position = await _context.Positions
            .FirstOrDefaultAsync(x => x.Id == request.PositionId);

        if (position is null)
        {
            return null;
        }

        Resume? resume = null;

        if (request.ResumeId.HasValue)
        {
            resume = await _context.Resumes
                .FirstOrDefaultAsync(r =>
                r.Id == request.ResumeId && 
                r.UserId == userId);

            if (resume is null)
            {
                return null;
            }
        }

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

        var detectedSkills = resume?.ExtractedText is not null
            ? DetectSkillsFromText(resume.ExtractedText)
            : new List<string>();

        var questions = GenerateQuestionsByPositionAndSkills(
            position.Name,
            session.Id,
            detectedSkills
            );

        _context.Questions.AddRange(questions);
        await _context.SaveChangesAsync();

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
    /// Bu metot position ve belirlenen skillere göre soru üretimini sağlar
    /// </summary>
    /// <param name="positionName"></param>
    /// <param name="sessionId"></param>
    /// <param name="detectedSkills"></param>
    /// <returns></returns>
    private List<Question> GenerateQuestionsByPositionAndSkills(
        string positionName,
        int sessionId,
        List<string> detectedSkills)
    {
        var questions = new List<Question>();

        var positionQuestions = GenerateQuestionsByPosition(positionName, sessionId);

        questions.AddRange(positionQuestions.Take(4));

        var cvBasedQuestions = GenerateCvBasedQuestions(sessionId, detectedSkills);

        questions.AddRange(cvBasedQuestions.Take(3));

        var behavioralQuestions = GenerateBehavioralQuestions(sessionId);

        questions.AddRange(behavioralQuestions.Take(1));

        return questions
            .GroupBy(q => q.QuestionText)
            .Select(g => g.First())
            .Take(8)
            .ToList();
    }

    private List<Question> GenerateCvBasedQuestions(int sessionId, List<string> detectedSkills)
    {
        var questions = new List<Question>();

        if (detectedSkills.Contains("ASP.NET Core"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde ASP.NET Core deneyimi görünüyor. ASP.NET Core ile geliştirdiğin bir projede controller, service ve repository katmanlarını nasıl ayırdın?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("SQL") || detectedSkills.Contains("SQL Server") || detectedSkills.Contains("SQLite"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde SQL bilgisi yer alıyor. INNER JOIN ve LEFT JOIN arasındaki farkı örnek bir senaryo üzerinden açıklar mısın?",
                Difficulty = "Easy",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("Python"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde Python yer alıyor. Python ile veri işleme veya analiz yaparken hangi kütüphaneleri kullandın ve neden?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("OpenCV"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde OpenCV deneyimi görünüyor. Görüntü işleme projenizde grileştirme, threshold veya contour işlemlerini neden kullandığını açıklar mısın?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("Power BI"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde Power BI yer alıyor. Bir dashboard hazırlarken hangi metrikleri seçersin ve görselleştirmeyi nasıl tasarlarsın?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("JWT"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde JWT bilgisi görünüyor. JWT tabanlı authentication yapısında token üretme ve doğrulama sürecini açıklar mısın?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("Docker"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde Docker yer alıyor. Bir uygulamayı container içine almanın avantajları nelerdir?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("Kotlin") || detectedSkills.Contains("Android"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde Android/Kotlin deneyimi görünüyor. Android uygulamasında kullanıcıdan veri alıp işleme sürecini nasıl yönettin?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("Machine Learning"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde Machine Learning bilgisi görünüyor. Bir modelin başarısını değerlendirirken hangi metrikleri kullanırsın?",
                Difficulty = "Medium",
                Category = "CV-Based"
            });
        }

        if (detectedSkills.Contains("Git"))
        {
            questions.Add(new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CV'nde Git/GitHub yer alıyor. Takım çalışmasında branch, commit ve pull request süreçlerini nasıl yönetirsin?",
                Difficulty = "Easy",
                Category = "CV-Based"
            });
        }

        return questions;
    }

    private List<Question> GenerateBehavioralQuestions(int sessionId)
    {
        return new List<Question>
    {
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Daha önce bilmediğin bir teknolojiyle karşılaştığında nasıl öğrenip projeye uyguladın?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Bir projede karşılaştığın teknik bir problemi nasıl analiz edip çözdüğünü anlatır mısın?",
            Difficulty = "Medium",
            Category = "Behavioral"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Takım çalışmasında fikir ayrılığı yaşandığında nasıl iletişim kurarsın?",
            Difficulty = "Easy",
            Category = "Behavioral"
        }
    };
    }

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
    //Bu metot, verilen pozisyon adına göre önceden tanımlanmış soruları oluşturur ve bu soruları belirtilen mülakat seansına (sessionId) atar. Eğer pozisyon adı tanımlı değilse, genel bir soru seti döndürür.

    public async Task<InterviewResultDto?> GetInterviewResultAsync(int userId, int sessionId)
    {
        var session = await _context.InterviewSessions
            .Include(s => s.Position)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);//Bu sayede kullanıcı sadece kendi mülakat sonucunu görebilir. Başka bir kullanıcının session sonucunu göremez.

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

        var generalEvaluation = GenerateGeneralEvaluation(averageScore, 
            answeredQuestions, 
            session.Questions.Count
            );

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
            Questions = session.Questions.Select(q => new InterviewResultQuestionDto
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
    // Bu metot, belirli bir mülakat seansı için kullanıcının verdiği cevapları ve bu cevaplara ilişkin puanları içeren detaylı bir sonuç döndürür. Mülakat seansının hangi pozisyon için yapıldığı, ne zaman başladığı ve tamamlandığı, toplam soru sayısı, cevaplanan soru sayısı ve ortalama puan gibi bilgileri içerir. Ayrıca, her bir sorunun detaylarını içeren InterviewResultQuestionDto türünde bir liste de bulundurur.

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
    //Bu metot , belirli bir kullanıcıya ait tüm mülakat seanslarını döndürür.
    //Her bir seans için pozisyon adı, başlangıç ve bitiş zamanı, toplam puan, toplam soru sayısı, cevaplanan soru sayısı ve seansın durumu (In Progress veya Completed)
    //gibi bilgileri içeren MyInterviewSessionDto türünde bir liste döndürür. Seanslar başlangıç zamanına göre azalan sırayla sıralanır, böylece en son yapılan mülakat seansı ilk olarak görüntülenir.

    //private int CalculateBasicScore(string userAnswer)
    //{
    //    if (string.IsNullOrWhiteSpace(userAnswer))
    //    {
    //        return 0;
    //    }

    //    if (userAnswer.Length < 30)
    //    {
    //        return 40;
    //    }

    //    if (userAnswer.Length < 100)
    //    {
    //        return 70;
    //    }

    //    return 85;
    //}

    /// <summary>
    ///     /// Basic Feedback metodu cevap yazıldı yazılmadı şeklinde puanlama yapıyordu
    /// Bu metot ise uzunluğa kısalığa, teknik olmasına ve örnek olmasına göre puanlama yapıyor
    /// </summary>
    /// <param name="userAnswer"></param>
    /// <param name="category"></param>
    /// <param name="questionText"></param>
    /// <returns></returns>
    private int CalculateSmartScore(
    string userAnswer,
    string category,
    string questionText)
    {
        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return 0;
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

        if (score > 100)
        {
            score = 100;
        }

        return score;
    }


    //private string GenerateBasicFeedback(string userAnswer)
    //{
    //    if (string.IsNullOrWhiteSpace(userAnswer))
    //    {
    //        return "Cevap boş bırakılmış. Soruyu teknik kavramlarla açıklamaya çalışmalısın.";
    //    }

    //    if (userAnswer.Length < 30)
    //    {
    //        return "Cevap çok kısa. Daha açıklayıcı ve örnek içeren bir cevap vermelisin.";
    //    }

    //    if (userAnswer.Length < 100)
    //    {
    //        return "Cevap temel olarak yeterli. Daha teknik detay ve örnek ekleyerek güçlendirebilirsin.";
    //    }

    //    return "Cevap detaylı görünüyor. Teknik doğruluk ve örneklerle destekleme açısından değerlendirilebilir.";
    //}

    /// <summary>
    /// Kullanıcıya daha açıklayıcı feedba
    /// </summary>
    /// <param name="userAnswer"></param>
    /// <param name="category"></param>
    /// <param name="questionText"></param>
    /// <returns></returns>
    private string GenerateSmartFeedback(
    string userAnswer,
    string category,
    string questionText)
    {
        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return "Cevap boş bırakılmış. Soruyu teknik kavramlarla açıklamaya çalışmalısın.";
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
    /// Bu metot soruya göre hangi kelimelerin cevapta beklendiğini belirler
    /// </summary>
    /// <param name="normalizedCategory"></param>
    /// <param name="normalizedQuestion"></param>
    /// <returns></returns>
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
    /// Bu metot cevapta örnek verilip verilmediğini kontrol eder
    /// </summary>
    /// <param name="normalizedAnswer"></param>
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

    private List<Question> GenerateQuestionsByPosition(string positionName, int sessionId)
    {
        if (positionName == "Backend Developer")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "REST API nedir ve neden kullanılır?",
                Difficulty = "Easy",
                Category = "Backend"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "GET ve POST HTTP metotları arasındaki fark nedir?",
                Difficulty = "Easy",
                Category = "API"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Entity Framework Core nedir ve projede neden kullanılır?",
                Difficulty = "Medium",
                Category = "Database"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "JWT Authentication nasıl çalışır?",
                Difficulty = "Medium",
                Category = "Security"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Dependency Injection nedir ve ASP.NET Core’da nasıl kullanılır?",
                Difficulty = "Medium",
                Category = "Architecture"
            }
        };
        }

        if (positionName == "Data Analyst")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "SQL'de INNER JOIN ve LEFT JOIN arasındaki fark nedir?",
                Difficulty = "Easy",
                Category = "SQL"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Eksik veriyle karşılaştığında nasıl bir analiz süreci izlersin?",
                Difficulty = "Medium",
                Category = "Data Cleaning"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Ortalama, medyan ve standart sapma neyi ifade eder?",
                Difficulty = "Easy",
                Category = "Statistics"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Power BI'da dashboard hazırlarken nelere dikkat edersin?",
                Difficulty = "Medium",
                Category = "BI"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Bir veri setinde aykırı değerleri nasıl tespit edersin?",
                Difficulty = "Medium",
                Category = "EDA"
            }
        };
        }

        if (positionName == "DevOps Engineer")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Docker nedir ve neden kullanılır?",
                Difficulty = "Easy",
                Category = "Docker"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CI/CD nedir?",
                Difficulty = "Easy",
                Category = "CI/CD"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Linux'ta temel dosya ve süreç yönetimi komutları nelerdir?",
                Difficulty = "Medium",
                Category = "Linux"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Bir uygulama deploy edilirken hangi adımları takip edersin?",
                Difficulty = "Medium",
                Category = "Deployment"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Container ile virtual machine arasındaki fark nedir?",
                Difficulty = "Medium",
                Category = "Infrastructure"
            }
        };
        }

        if (positionName == "Business Analyst")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Requirement nedir?",
                Difficulty = "Easy",
                Category = "Business Analysis"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Functional ve non-functional requirement arasındaki fark nedir?",
                Difficulty = "Medium",
                Category = "Requirement Analysis"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "User story nasıl yazılır?",
                Difficulty = "Easy",
                Category = "Agile"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Eksik veya belirsiz bir talep geldiğinde nasıl ilerlersin?",
                Difficulty = "Medium",
                Category = "Analysis"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Acceptance criteria nedir ve neden önemlidir?",
                Difficulty = "Medium",
                Category = "Documentation"
            }
        };
        }

        return new List<Question>
    {
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "OOP nedir?",
            Difficulty = "Easy",
            Category = "Software"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Veritabanında primary key ve foreign key nedir?",
            Difficulty = "Easy",
            Category = "Database"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "REST API nedir?",
            Difficulty = "Easy",
            Category = "API"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Git ve GitHub ne için kullanılır?",
            Difficulty = "Easy",
            Category = "Version Control"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Bir yazılım projesinde hata ayıklama sürecini nasıl yönetirsin?",
            Difficulty = "Medium",
            Category = "Problem Solving"
        }
    };
    }

    /// <summary>
    /// Bu metot skoru 75 ve üzeri olan soruların kategorilerini alıyor
    /// Bu alanları güçlü alan olarak gösteriyor
    /// </summary>
    /// <param name="questions"></param>
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
    /// Bu metot skoru 60 altı olan veya cevaplanmamış soruların kategorilerini belirliyor
    /// Buna göre geliştirilmesi gereken alanların listesini veriyor
    /// </summary>
    /// <param name="questions"></param>
    /// <returns></returns>
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
    /// Bu metot kategoriye göre çalışma önerisi üretmeyi sağlıyor
    /// </summary>
    /// <param name="improvementAreas"></param>
    /// <returns>Geliştirilmesi gereken alanlar</returns>
    private List<string> GetStudyRecommendations(List<string> improvementAreas)
    {
        var recommendations = new List<string>();

        foreach (var area in improvementAreas)
        {
            var normalizedArea = area.ToLower();

            if (normalizedArea.Contains("api") ||
                normalizedArea.Contains("backend"))
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
    /// Bu metot genel bir yorum üretir
    /// </summary>
    /// <param name="averageScore"></param>
    /// <param name="answeredQuestions"></param>
    /// <param name="totalQuestions"></param>
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
    /// Bu metot soruları kategorilere göre gruplandırıyor
    /// her kategoriden kaç ssoru var kontrolü yappıyor
    /// kaçı cevaplanmış bakıyor 
    /// cevaplananların ortalama skorunu hesaplıyor
    /// </summary>
    /// <param name="questions"></param>
    /// <returns></returns>
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
}