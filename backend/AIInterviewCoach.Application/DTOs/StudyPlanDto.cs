namespace AIInterviewCoach.Application.DTOs;

public class StudyPlanDto
{
	public string GeneralSummary { get; set; } = string.Empty;
	public List<string> StrongAreas { get; set; } = new();
	public List<string> WeakAreas { get; set; } = new();
	public List<string> RecommendedPracticeModes { get; set; } = new();
	public List<string> TechnicalFocusTopics { get; set; } = new();
	public List<string> CommunicationFocusTopics { get; set; } = new();
	public List<WeeklyStudyPlanItemDto> WeeklyPlan { get; set; } = new();
}

public class WeeklyStudyPlanItemDto
{
	public string Day { get; set; } = string.Empty;
	public string Focus { get; set; } = string.Empty;
	public string Task { get; set; } = string.Empty;
	public string PracticeMode { get; set; } = string.Empty;
}