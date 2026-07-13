using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

/// <summary>
/// Bu interface şu işlevi yerine getirir: Belirli bir pozisyon, mülakat modu, 
/// zorluk seviyesi ve soru sayısına göre yapay zeka tarafından üretilmiş soruları almak için bir sözleşme sağlar. 
/// Ayrıca, isteğe bağlı olarak programlama dili ve özgeçmiş içeriği de sağlanabilir.
/// </summary>

public interface IAiQuestionGenerationService
{
    Task<List<AiGeneratedQuestionDto>> GenerateQuestionsAsync(
        string positionName,
        string interviewMode,
        string difficulty,
        int questionCount,
        string? programmingLanguage,
        string? resumeContent);
}