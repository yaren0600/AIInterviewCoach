using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIInterviewCoach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]//Bu controller’daki endpointlere sadece token ile erişilebilir.
public class InterviewsController : ControllerBase
{
    private readonly IInterviewService _interviewService;

    public InterviewsController(IInterviewService interviewService)
    {
        _interviewService = interviewService;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartInterview(StartInterviewRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Kullanıcı bilgisi alınamadı.",
                Data = null
            });
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.StartInterviewAsync(userId, request);

        if (result is null)
        {
            return BadRequest(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Geçersiz pozisyon seçimi veya CV bulunamadı.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<InterviewSessionDto>
        {
            Success = true,
            Message = "Mülakat başarıyla başlatıldı.",
            Data = result
        });
    }

    [HttpPost("answer")]
    public async Task<IActionResult> SubmitAnswer(SubmitAnswerRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Kullanıcı bilgisi alınamadı.",
                Data = null
            });
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.SubmitAnswerAsync(userId, request);

        if (result is null)
        {
            return BadRequest(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Soru bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<AnswerDto>
        {
            Success = true,
            Message = "Cevap başarıyla kaydedildi ve değerlendirildi.",
            Data = result
        });
    }

    [HttpGet("{sessionId}/result")]
    public async Task<IActionResult> GetResult(int sessionId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Kullanıcı bilgisi alınamadı.",
                Data = null
            });
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.GetInterviewResultAsync(userId, sessionId);

        if (result is null)
        {
            return NotFound(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Mülakat oturumu bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<InterviewResultDto>
        {
            Success = true,
            Message = "Mülakat sonucu başarıyla getirildi.",
            Data = result
        });
    }

    [HttpGet("my-sessions")]
    public async Task<IActionResult> GetMySessions()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Kullanıcı bilgisi alınamadı.",
                Data = null
            });
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.GetMySessionsAsync(userId);

        return Ok(new ApiResponseDto<List<MyInterviewSessionDto>>
        {
            Success = true,
            Message = "Mülakat oturumları başarıyla getirildi.",
            Data = result
        });
    }
}


