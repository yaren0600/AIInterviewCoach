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

        return new DashboardDto
        {
            TotalInterviews = sessions.Count,
            CompletedInterviews = completedSessions.Count,
            InProgressInterviews = sessions.Count - completedSessions.Count,
            AverageScore = averageScore,
            RecentInterviews = recentInterviews,
            PositionSummaries = positionSummaries
        };
    }
}