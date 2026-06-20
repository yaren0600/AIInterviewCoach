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
    public List<InterviewResultQuestionDto> Questions { get; set; } = new();

}

// Bu DTO, bir mülakat seansının genel sonuçlarını temsil eder. Mülakatın hangi pozisyon için yapıldığı, ne zaman başladığı ve tamamlandığı, toplam soru sayısı, cevaplanan soru sayısı ve ortalama puan gibi bilgileri içerir. Ayrıca, her bir sorunun detaylarını içeren InterviewResultQuestionDto türünde bir liste de bulundurur.
