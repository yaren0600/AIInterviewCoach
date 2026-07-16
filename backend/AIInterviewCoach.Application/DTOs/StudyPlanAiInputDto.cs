namespace AIInterviewCoach.Application.DTOs;

public class StudyPlanAiInputDto
{
    public int TotalSessions { get; set; }
    public int AnsweredQuestionCount { get; set; }
    public string StrongestCategory { get; set; } = string.Empty;
    public string WeakestCategory { get; set; } = string.Empty;
    public List<string> StrongAreas { get; set; } = new();
    public List<string> WeakAreas { get; set; } = new();
    public List<string> RecommendedPracticeModes { get; set; } = new();
    public List<string> TechnicalFocusTopics { get; set; } = new();
    public List<string> CommunicationFocusTopics { get; set; } = new();
    public List<string> CategoryPerformanceSummaries { get; set; } = new();
    public bool IsRegenerationRequested { get; set; }
    public string RegenerationSeed { get; set; } = string.Empty;
}