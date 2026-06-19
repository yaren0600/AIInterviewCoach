using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Domain.Entities;

public class Question
{

    public int Id { get; set; }

    public int InterviewSessionId { get; set; }

    public  InterviewSession InterviewSession { get; set; } = null!;

    public string QuestionText { get; set; } = string.Empty;

    public string Difficulty { get; set; } = string.Empty;

    public string Category {  get; set; } = string.Empty;

    public Answer? Answer { get; set; }
    
}
