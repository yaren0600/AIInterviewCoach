using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Dashboard’daki “Son Mülakatlarım” listesindeki her bir satırı temsil eder.
/// </summary>
public class DashboardRecentInterviewDto
{
    public int SessionId { get; set; }
    public string PositionName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? TotalScore { get; set; }
    public string Status { get; set; } = string.Empty;
}