namespace AIInterviewCoach.Application.DTOs;

public class StudyPlanDto
{
    public string GeneralSummary { get; set; } = string.Empty;
    public int TotalTaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public int DevelopmentProgress { get; set; }
    public List<string> StrongAreas { get; set; } = new();
    public List<string> WeakAreas { get; set; } = new();
    public List<string> RecommendedPracticeModes { get; set; } = new();
    public List<string> TechnicalFocusTopics { get; set; } = new();
    public List<string> CommunicationFocusTopics { get; set; } = new();
    public List<WeeklyStudyPlanItemDto> WeeklyPlan { get; set; } = new();
}

public class WeeklyStudyPlanItemDto
{
    public int Id { get; set; }
    public string Day { get; set; } = string.Empty;
    public string Focus { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string PracticeMode { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}