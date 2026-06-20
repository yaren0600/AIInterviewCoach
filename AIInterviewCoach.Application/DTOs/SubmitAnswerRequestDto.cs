using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class SubmitAnswerRequestDto
{
    public int QuestionId { get; set; }
    public string UserAnswer { get; set; } = string.Empty;
}
