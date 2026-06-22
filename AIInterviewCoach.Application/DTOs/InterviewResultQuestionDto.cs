using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class InterviewResultQuestionDto
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? UserAnswer { get; set; }
    public int? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime? AnsweredAt { get; set; }
}

// bu DTO , InterviewResultDto içindeki Questions listesinde kullanılacak ve her bir sorunun detaylarını içerecek şekilde tasarlanmıştır.
// Kullanıcı tarafından verilen cevaba, puana ve geri bildirime dair bilgileri de içermektedir.