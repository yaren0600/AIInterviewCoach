using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class AnswerDto
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string UserAnswer { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public DateTime AnsweredAt { get; set; }

}
