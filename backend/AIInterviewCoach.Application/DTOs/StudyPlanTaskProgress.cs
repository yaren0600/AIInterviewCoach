namespace AIInterviewCoach.Domain.Entities;

public class StudyPlanTaskProgress
/// <summary>
/// Bu entity, kullanıcının belirli bir gün için belirli bir görevdeki ilerlemesini temsil eder.
/// </summary>
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Day { get; set; } = string.Empty;
    public string Focus { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string PracticeMode { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public User User { get; set; } = null!;
}