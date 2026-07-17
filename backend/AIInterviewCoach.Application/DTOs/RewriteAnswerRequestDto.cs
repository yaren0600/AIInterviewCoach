namespace AIInterviewCoach.Application.DTOs;

public class RewriteAnswerRequestDto
{
    public string QuestionText { get; set; } = string.Empty;
    public string UserAnswer { get; set; } = string.Empty;
    public string PositionName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}