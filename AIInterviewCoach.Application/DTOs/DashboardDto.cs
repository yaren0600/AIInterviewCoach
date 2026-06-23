using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Dashboard ekranında gösterilecek bütün özet bilgilerin ana paketi.
/// </summary>
public class DashboardDto
{
    public int TotalInterviews { get; set; }
    public int CompletedInterviews { get; set; }
    public int InProgressInterviews { get; set; }
    public int? AverageScore { get; set; }

    public List<DashboardRecentInterviewDto> RecentInterviews { get; set; } = new();

    public List<DashboardPositionSummaryDto> PositionSummaries { get; set; } = new();
}