using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

public interface IStudyPlanService
{
    Task<StudyPlanDto> GetMyStudyPlanAsync(int userId);
    Task<bool> CompleteTaskAsync(int userId, int taskId);
    Task<bool> UncompleteTaskAsync(int userId, int taskId);
}