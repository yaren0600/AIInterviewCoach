using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

public interface IAiAnswerRewriteService
{
    Task<RewriteAnswerResponseDto> RewriteAnswerAsync(RewriteAnswerRequestDto request);
}