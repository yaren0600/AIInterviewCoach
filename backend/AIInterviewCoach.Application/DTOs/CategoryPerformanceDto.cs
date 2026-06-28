using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class CategoryPerformanceDto
{
    public string Category { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public int AnsweredQuestionCount { get; set; }
    public int? AverageScore { get; set; }
}
