using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AIInterviewCoach.Infrastructure.Services;

/// <summary>
/// Veritabanından kullanıcıya ait mülakatları alır, 
/// hesaplamaları yapar ve dashboard response’unu hazırlar.
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId)
    {
        var sessions = await _context.InterviewSessions
            .Include(s => s.Position)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var completedSessions = sessions
            .Where(s => s.CompletedAt is not null)
            .ToList();

        var scoredSessions = sessions
            .Where(s => s.TotalScore.HasValue)
            .ToList();

        int? averageScore = scoredSessions.Any()
            ? Convert.ToInt32(scoredSessions.Average(s => s.TotalScore!.Value))
            : null;

        var recentInterviews = sessions
            .OrderByDescending(s => s.StartedAt)
            .Take(5)
            .Select(s => new DashboardRecentInterviewDto
            {
                SessionId = s.Id,
                PositionName = s.Position.Name,
                StartedAt = s.StartedAt,
                CompletedAt = s.CompletedAt,
                TotalScore = s.TotalScore,
                Status = s.CompletedAt is null ? "In Progress" : "Completed"
            })
            .ToList();

        var positionSummaries = sessions
            .GroupBy(s => s.Position.Name)
            .Select(g =>
            {
                var scored = g.Where(x => x.TotalScore.HasValue).ToList();

                return new DashboardPositionSummaryDto
                {
                    PositionName = g.Key,
                    InterviewCount = g.Count(),
                    AverageScore = scored.Any()
                        ? Convert.ToInt32(scored.Average(x => x.TotalScore!.Value))
                        : null
                };
            })
            .OrderByDescending(x => x.InterviewCount)
            .ToList();
        var completionRate = sessions.Any()
            ? Math.Round((double)completedSessions.Count / sessions.Count * 100, 2)
            : 0;
        var answeredQuestions = sessions
            .SelectMany(s => s.Questions)
            .Where(q => q.Answer is not null && q.Answer.Score.HasValue)
            .ToList();

        var strongestCategory = answeredQuestions.Any()
            ? answeredQuestions
                .GroupBy(q => q.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    AverageScore = g.Average(q => q.Answer!.Score!.Value)
                })
                .OrderByDescending(x => x.AverageScore)
                .First()
                .Category
            : "Henüz güçlü kategori tespit edilemedi.";

        var weakestCategory = answeredQuestions.Any()
            ? answeredQuestions
                .GroupBy(q => q.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    AverageScore = g.Average(q => q.Answer!.Score!.Value)
                })
                .OrderBy(x => x.AverageScore)
                .First()
                .Category
            : "Henüz zayıf kategori tespit edilemedi.";

        var latestRecommendation = GenerateLatestRecommendation(weakestCategory);

        return new DashboardDto
        {
            TotalInterviews = sessions.Count,
            CompletedInterviews = completedSessions.Count,
            InProgressInterviews = sessions.Count - completedSessions.Count,
            AverageScore = averageScore,
            CompletionRate = completionRate,
            StrongestCategory = strongestCategory,
            WeakestCategory = weakestCategory,
            LatestRecommendation = latestRecommendation,
            RecentInterviews = recentInterviews,
            PositionSummaries = positionSummaries
        };
    }

    private string GenerateLatestRecommendation(string weakestCategory)
    {
        var normalizedCategory = weakestCategory.ToLower();

        if (normalizedCategory.Contains("api") ||
            normalizedCategory.Contains("backend"))
        {
            return "REST API, HTTP metotları ve endpoint tasarımı konularını tekrar etmen iyi olur.";
        }

        if (normalizedCategory.Contains("security"))
        {
            return "JWT, authentication ve authorization konularını tekrar etmen önerilir.";
        }

        if (normalizedCategory.Contains("database") ||
            normalizedCategory.Contains("sql"))
        {
            return "SQL JOIN türleri, primary key, foreign key ve temel sorgu yazımı çalışabilirsin.";
        }

        if (normalizedCategory.Contains("cv-based"))
        {
            return "CV'nde yazan teknolojileri proje örnekleriyle daha net açıklama pratiği yapabilirsin.";
        }

        if (normalizedCategory.Contains("behavioral"))
        {
            return "Davranışsal sorular için STAR tekniğiyle cevap verme pratiği yapabilirsin.";
        }

        if (normalizedCategory.Contains("data") ||
            normalizedCategory.Contains("statistics") ||
            normalizedCategory.Contains("eda"))
        {
            return "Veri analizi, temel istatistik ve görselleştirme konularını tekrar edebilirsin.";
        }

        if (weakestCategory.Contains("Henüz"))
        {
            return "Henüz yeterli cevap olmadığı için öneri oluşturulamadı.";
        }

        return $"{weakestCategory} alanında temel kavramları tekrar edip örnek cevaplar hazırlayabilirsin.";
    }
}