using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

public interface IStudyPlanAiService
{
    Task<StudyPlanDto?> GenerateStudyPlanAsync(StudyPlanAiInputDto input);
}