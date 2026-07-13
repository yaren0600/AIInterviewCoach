namespace AIInterviewCoach.Application.DTOs;

public class AiGeneratedQuestionDto
{
    public string QuestionText { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string ExpectedAnswerGuide { get; set; } = string.Empty;
}