using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class InterviewResultDto
{
    public int SessionId { get; set; }
    public string PositionName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public int? AverageScore { get; set; }
    public List<string> StrongAreas { get; set; } = new(); // cv sahibinin iyi olduğu alanlar
    public List<string> ImprovementAreas { get; set; } = new(); // geliştirilmesi gereken alanlar
    public List<string> StudyRecommendations {  get; set; } = new(); // çalışma önerileri
    public string GeneralEvaluation { get; set; } = string.Empty; // genel sonuç yorumu
    public List<CategoryPerformanceDto> CategoryPerformances { get; set; } = new();
    public List<InterviewResultQuestionDto> Questions { get; set; } = new();

}

// Bu DTO, bir mülakat seansının genel sonuçlarını temsil eder. Mülakatın hangi pozisyon için yapıldığı, ne zaman başladığı ve tamamlandığı, toplam soru sayısı, cevaplanan soru sayısı ve ortalama puan gibi bilgileri içerir. Ayrıca, her bir sorunun detaylarını içeren InterviewResultQuestionDto türünde bir liste de bulundurur.
