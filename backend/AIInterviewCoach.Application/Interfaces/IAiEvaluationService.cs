using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

/// <summary>
/// Bu interface , soru, cevap, kategori, zorluk, pozisyon verildiğinde değerlendirme sonucunu döndürür.
/// </summary>

public interface IAiEvaluationService
{
    Task<AiEvaluationResultDto> EvaluateAnswerAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName);
}