using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

public interface IStudyPlanService
{
    Task<StudyPlanDto> GetMyStudyPlanAsync(int userId);
}