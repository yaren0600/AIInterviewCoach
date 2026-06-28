using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Kullanıcının hangi pozisyonlarda ne kadar çalıştığını ve performansını özetler.
/// </summary>
public class DashboardPositionSummaryDto
{
    public string PositionName { get; set; } = string.Empty;
    public int InterviewCount { get; set; }
    public int? AverageScore { get; set; }
}

