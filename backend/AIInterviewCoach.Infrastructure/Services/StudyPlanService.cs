using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Domain.Entities;
using AIInterviewCoach.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AIInterviewCoach.Infrastructure.Services;

public class StudyPlanService : IStudyPlanService
{
    private readonly AppDbContext _context;

    public StudyPlanService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StudyPlanDto> GetMyStudyPlanAsync(int userId)
    {
        var sessions = await _context.InterviewSessions
            .Include(s => s.Position)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var answeredQuestions = sessions
            .SelectMany(s => s.Questions)
            .Where(q => q.Answer is not null && q.Answer.Score.HasValue)
            .ToList();

        if (!answeredQuestions.Any())
        {
            var emptyPlan = CreateEmptyStudyPlan();

            emptyPlan.WeeklyPlan = await SyncWeeklyPlanTasksAsync(userId, emptyPlan.WeeklyPlan);

            emptyPlan.TotalTaskCount = emptyPlan.WeeklyPlan.Count;
            emptyPlan.CompletedTaskCount = emptyPlan.WeeklyPlan.Count(x => x.IsCompleted);
            emptyPlan.DevelopmentProgress = CalculateDevelopmentProgress(
                emptyPlan.CompletedTaskCount,
                emptyPlan.TotalTaskCount);

            return emptyPlan;
        }

        var categoryPerformances = answeredQuestions
            .GroupBy(q => q.Category)
            .Select(g => new
            {
                Category = g.Key,
                AverageScore = Convert.ToInt32(g.Average(q => q.Answer!.Score!.Value)),
                QuestionCount = g.Count()
            })
            .OrderBy(x => x.AverageScore)
            .ToList();

        var weakAreas = categoryPerformances
            .Take(3)
            .Select(x => $"{x.Category} - Ortalama skor: {x.AverageScore}")
            .ToList();

        var strongAreas = categoryPerformances
            .OrderByDescending(x => x.AverageScore)
            .Take(3)
            .Select(x => $"{x.Category} - Ortalama skor: {x.AverageScore}")
            .ToList();

        var weakestCategory = categoryPerformances.First().Category;

        var strongestCategory = categoryPerformances
            .OrderByDescending(x => x.AverageScore)
            .First()
            .Category;

        var categories = categoryPerformances
            .Select(x => x.Category)
            .ToList();

        var technicalFocusTopics = GetTechnicalFocusTopics(categories);
        var communicationFocusTopics = GetCommunicationFocusTopics(categories);
        var recommendedPracticeModes = GetRecommendedPracticeModes(categories);

        var generatedWeeklyPlan = GenerateWeeklyPlan(weakestCategory, recommendedPracticeModes);

        var trackedWeeklyPlan = await SyncWeeklyPlanTasksAsync(userId, generatedWeeklyPlan);

        var completedTaskCount = trackedWeeklyPlan.Count(x => x.IsCompleted);
        var totalTaskCount = trackedWeeklyPlan.Count;
        var developmentProgress = CalculateDevelopmentProgress(completedTaskCount, totalTaskCount);

        return new StudyPlanDto
        {
            GeneralSummary = GenerateGeneralSummary(
                sessions.Count,
                answeredQuestions.Count,
                strongestCategory,
                weakestCategory),

            TotalTaskCount = totalTaskCount,
            CompletedTaskCount = completedTaskCount,
            DevelopmentProgress = developmentProgress,

            StrongAreas = strongAreas,
            WeakAreas = weakAreas,
            RecommendedPracticeModes = recommendedPracticeModes,
            TechnicalFocusTopics = technicalFocusTopics,
            CommunicationFocusTopics = communicationFocusTopics,
            WeeklyPlan = trackedWeeklyPlan
        };
    }

    public async Task<bool> CompleteTaskAsync(int userId, int taskId)
    {
        var task = await _context.StudyPlanTaskProgresses
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task is null)
        {
            return false;
        }

        task.IsCompleted = true;
        task.CompletedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UncompleteTaskAsync(int userId, int taskId)
    {
        var task = await _context.StudyPlanTaskProgresses
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task is null)
        {
            return false;
        }

        task.IsCompleted = false;
        task.CompletedAt = null;

        await _context.SaveChangesAsync();

        return true;
    }

    private StudyPlanDto CreateEmptyStudyPlan()
    {
        return new StudyPlanDto
        {
            GeneralSummary = "Henüz yeterli mülakat cevabı olmadığı için kişisel gelişim planı başlangıç seviyesinde oluşturuldu. İlk kişisel analiz için en az bir mülakat oturumunu tamamlamalısın.",

            StrongAreas = new List<string>
            {
                "Henüz güçlü alan tespit edilemedi."
            },

            WeakAreas = new List<string>
            {
                "Henüz gelişim alanı tespit edilemedi."
            },

            RecommendedPracticeModes = new List<string>
            {
                "Mixed",
                "CV-Based",
                "Behavioral"
            },

            TechnicalFocusTopics = new List<string>
            {
                "Önce kısa bir karma mülakat pratiği yap.",
                "Cevaplarını örneklerle desteklemeye çalış.",
                "Her cevaptan sonra AI geri bildirimlerini incele."
            },

            CommunicationFocusTopics = new List<string>
            {
                "Cevaplarını giriş, açıklama ve sonuç şeklinde yapılandır.",
                "Davranışsal sorular için STAR tekniğini kullan.",
                "Teknik konuları kısa örneklerle anlatmaya çalış."
            },

            WeeklyPlan = new List<WeeklyStudyPlanItemDto>
            {
                new()
                {
                    Day = "1. Gün",
                    Focus = "Başlangıç analizi",
                    Task = "Mixed modda 5 soruluk kısa bir mülakat pratiği yap.",
                    PracticeMode = "Mixed"
                },
                new()
                {
                    Day = "2. Gün",
                    Focus = "CV anlatımı",
                    Task = "CV’ndeki bir projeyi 2 dakika içinde problem, çözüm ve sonuç şeklinde anlatma pratiği yap.",
                    PracticeMode = "CV-Based"
                },
                new()
                {
                    Day = "3. Gün",
                    Focus = "Davranışsal cevap",
                    Task = "STAR tekniğiyle 3 davranışsal soru cevapla.",
                    PracticeMode = "Behavioral"
                },
                new()
                {
                    Day = "4. Gün",
                    Focus = "Teknik temel tekrar",
                    Task = "SQL, API veya proje anlatımı konularından birini seçip kısa cevap taslakları hazırla.",
                    PracticeMode = "Technical"
                },
                new()
                {
                    Day = "5. Gün",
                    Focus = "Kısa tekrar mülakatı",
                    Task = "5 soruluk kısa bir pratik yap ve önceki cevaplarına göre daha net cevap vermeye çalış.",
                    PracticeMode = "Mixed"
                },
                new()
                {
                    Day = "6. Gün",
                    Focus = "Geri bildirim inceleme",
                    Task = "AI geri bildirimlerinden en sık tekrar eden 3 gelişim notunu listele.",
                    PracticeMode = "Mixed"
                },
                new()
                {
                    Day = "7. Gün",
                    Focus = "Haftalık değerlendirme",
                    Task = "Bu hafta tamamladığın görevleri kontrol et ve en zorlandığın alanı belirle.",
                    PracticeMode = "Mixed"
                }
            }
        };
    }

    private string GenerateGeneralSummary(
        int totalSessions,
        int answeredQuestionCount,
        string strongestCategory,
        string weakestCategory)
    {
        return $"Şu ana kadar {totalSessions} mülakat oturumundan {answeredQuestionCount} cevap analiz edildi. En güçlü alanın {strongestCategory}, en çok gelişime ihtiyaç duyan alanın ise {weakestCategory} görünüyor. Bu plana göre öncelik, zayıf alanlarını düzenli pratikle güçlendirmek ve güçlü alanlarını mülakat anlatımında daha görünür hale getirmek.";
    }

    private List<string> GetRecommendedPracticeModes(List<string> categories)
    {
        var modes = new List<string>();

        foreach (var category in categories)
        {
            var normalizedCategory = category.ToLower();

            if (normalizedCategory.Contains("sql"))
            {
                modes.Add("SQL Practice");
            }

            if (normalizedCategory.Contains("coding"))
            {
                modes.Add("Coding Practice");
            }

            if (normalizedCategory.Contains("behavioral"))
            {
                modes.Add("Behavioral");
            }

            if (normalizedCategory.Contains("cv"))
            {
                modes.Add("CV-Based");
            }

            if (normalizedCategory.Contains("technical") ||
                normalizedCategory.Contains("api") ||
                normalizedCategory.Contains("backend") ||
                normalizedCategory.Contains("security"))
            {
                modes.Add("Technical");
            }

            if (normalizedCategory.Contains("role"))
            {
                modes.Add("Role-Based");
            }
        }

        if (!modes.Any())
        {
            modes.Add("Mixed");
            modes.Add("Technical");
            modes.Add("Behavioral");
        }

        return modes
            .Distinct()
            .Take(4)
            .ToList();
    }

    private List<string> GetTechnicalFocusTopics(List<string> categories)
    {
        var topics = new List<string>();

        foreach (var category in categories)
        {
            var normalizedCategory = category.ToLower();

            if (normalizedCategory.Contains("sql") ||
                normalizedCategory.Contains("database"))
            {
                topics.Add("SQL JOIN türleri, GROUP BY, HAVING ve temel sorgu yazımı.");
            }

            if (normalizedCategory.Contains("api") ||
                normalizedCategory.Contains("backend") ||
                normalizedCategory.Contains("technical"))
            {
                topics.Add("REST API, controller-service yapısı, HTTP metotları ve endpoint mantığı.");
            }

            if (normalizedCategory.Contains("security") ||
                normalizedCategory.Contains("jwt"))
            {
                topics.Add("JWT, authentication, authorization ve claim mantığı.");
            }

            if (normalizedCategory.Contains("coding"))
            {
                topics.Add("Fonksiyon yazma, döngüler, koşullar, koleksiyonlar ve basit algoritma pratiği.");
            }

            if (normalizedCategory.Contains("cv"))
            {
                topics.Add("CV’deki projeleri teknoloji, problem, çözüm ve sonuç şeklinde anlatma.");
            }
        }

        if (!topics.Any())
        {
            topics.Add("Temel teknik kavramları kısa tanım + örnek + proje bağlantısı ile tekrar et.");
            topics.Add("SQL, API ve proje anlatımı konularında kısa cevap taslakları hazırla.");
        }

        return topics
            .Distinct()
            .Take(5)
            .ToList();
    }

    private List<string> GetCommunicationFocusTopics(List<string> categories)
    {
        var topics = new List<string>();

        foreach (var category in categories)
        {
            var normalizedCategory = category.ToLower();

            if (normalizedCategory.Contains("behavioral"))
            {
                topics.Add("Davranışsal sorularda STAR tekniğiyle cevap verme.");
                topics.Add("Zor durumları anlatırken sonuç ve öğrenim kısmını net belirtme.");
            }

            if (normalizedCategory.Contains("cv"))
            {
                topics.Add("Projeleri kısa, anlaşılır ve ölçülebilir çıktılarla anlatma.");
            }

            if (normalizedCategory.Contains("technical") ||
                normalizedCategory.Contains("sql") ||
                normalizedCategory.Contains("coding"))
            {
                topics.Add("Teknik cevaplarda önce tanım, sonra kullanım amacı, sonra örnek verme.");
            }
        }

        if (!topics.Any())
        {
            topics.Add("Cevaplarını giriş, gelişme ve sonuç şeklinde yapılandır.");
            topics.Add("Her cevapta en az bir proje veya gerçek senaryo örneği kullan.");
        }

        return topics
            .Distinct()
            .Take(5)
            .ToList();
    }

    private List<WeeklyStudyPlanItemDto> GenerateWeeklyPlan(
        string weakestCategory,
        List<string> recommendedModes)
    {
        var firstMode = recommendedModes.ElementAtOrDefault(0) ?? "Mixed";
        var secondMode = recommendedModes.ElementAtOrDefault(1) ?? "Technical";
        var thirdMode = recommendedModes.ElementAtOrDefault(2) ?? "Behavioral";

        return new List<WeeklyStudyPlanItemDto>
        {
            new()
            {
                Day = "1. Gün",
                Focus = "Zayıf alan analizi",
                Task = $"{weakestCategory} alanındaki son cevaplarını incele ve AI geri bildirimlerinden 3 gelişim notu çıkar.",
                PracticeMode = firstMode
            },
            new()
            {
                Day = "2. Gün",
                Focus = "Temel tekrar",
                Task = $"{weakestCategory} alanındaki temel kavramları kısa notlarla tekrar et.",
                PracticeMode = firstMode
            },
            new()
            {
                Day = "3. Gün",
                Focus = "Kısa mülakat pratiği",
                Task = "5 soruluk kısa bir pratik yap ve her cevabını örnekle desteklemeye çalış.",
                PracticeMode = secondMode
            },
            new()
            {
                Day = "4. Gün",
                Focus = "Cevap yapılandırma",
                Task = "Teknik cevaplarda tanım, kullanım amacı ve proje örneği sırasını kullan.",
                PracticeMode = secondMode
            },
            new()
            {
                Day = "5. Gün",
                Focus = "Davranışsal pratik",
                Task = "STAR tekniğiyle 3 davranışsal soru cevapla.",
                PracticeMode = thirdMode
            },
            new()
            {
                Day = "6. Gün",
                Focus = "Tam mülakat simülasyonu",
                Task = "8 veya 10 soruluk karma bir mülakat oturumu tamamla.",
                PracticeMode = "Mixed"
            },
            new()
            {
                Day = "7. Gün",
                Focus = "Haftalık değerlendirme",
                Task = "Hafta içindeki skorlarını karşılaştır ve en çok tekrar eden gelişim notlarını listele.",
                PracticeMode = "Mixed"
            }
        };
    }

    private async Task<List<WeeklyStudyPlanItemDto>> SyncWeeklyPlanTasksAsync(
        int userId,
        List<WeeklyStudyPlanItemDto> generatedTasks)
    {
        var existingTasks = await _context.StudyPlanTaskProgresses
            .Where(t => t.UserId == userId)
            .ToListAsync();

        foreach (var generatedTask in generatedTasks)
        {
            var existingTask = existingTasks.FirstOrDefault(t =>
                t.Day == generatedTask.Day &&
                t.Focus == generatedTask.Focus &&
                t.Task == generatedTask.Task);

            if (existingTask is null)
            {
                var newTask = new StudyPlanTaskProgress
                {
                    UserId = userId,
                    Day = generatedTask.Day,
                    Focus = generatedTask.Focus,
                    Task = generatedTask.Task,
                    PracticeMode = generatedTask.PracticeMode,
                    IsCompleted = false,
                    CompletedAt = null,
                    CreatedAt = DateTime.Now
                };

                _context.StudyPlanTaskProgresses.Add(newTask);
            }
        }

        await _context.SaveChangesAsync();

        var trackedTasks = await _context.StudyPlanTaskProgresses
            .Where(t => t.UserId == userId)
            .ToListAsync();

        return trackedTasks
            .OrderBy(t => GetDayNumber(t.Day))
            .ThenBy(t => t.Id)
            .Select(t => new WeeklyStudyPlanItemDto
            {
                Id = t.Id,
                Day = t.Day,
                Focus = t.Focus,
                Task = t.Task,
                PracticeMode = t.PracticeMode,
                IsCompleted = t.IsCompleted,
                CompletedAt = t.CompletedAt
            })
            .ToList();
    }

    private int CalculateDevelopmentProgress(int completedTaskCount, int totalTaskCount)
    {
        if (totalTaskCount == 0)
        {
            return 0;
        }

        return Convert.ToInt32(
            Math.Round((double)completedTaskCount / totalTaskCount * 100)
        );
    }

    private int GetDayNumber(string day)
    {
        var digits = new string(day.Where(char.IsDigit).ToArray());

        return int.TryParse(digits, out var number)
            ? number
            : 999;
    }
}