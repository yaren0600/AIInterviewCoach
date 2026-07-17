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
    private readonly IAiAnswerRewriteService _aiAnswerRewriteService;

    public InterviewsController(
        IInterviewService interviewService,
        IAiAnswerRewriteService aiAnswerRewriteService)
    {
        _interviewService = interviewService;
        _aiAnswerRewriteService = aiAnswerRewriteService;
    }
    // Bu endpoint, kullanıcının mülakat oturumunu başlatmak için kullanılır.
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

    // Bu endpoint, kullanıcının verdiği cevabı kaydetmek ve değerlendirmek için kullanılır.
    // Kullanıcı yalnızca kendi cevaplarını kaydedebilir ve değerlendirebilir.
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

    // Bu endpoint, belirli bir mülakat oturumunun sonucunu almak için kullanılır.
    // Kullanıcı yalnızca kendi oturumlarının sonuçlarını görebilir.
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

    //Bu endpoint, kullanıcının kendi mülakat oturumlarını listelemek için kullanılır.
    //Kullanıcı yalnızca kendi oturumlarını görebilir.
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

    /// <summary>
    /// Bu endpoint, belirli bir mülakat oturumunu silmek için kullanılır. 
    /// Kullanıcı yalnızca kendi mülakat oturumlarını silebilir.
    /// </summary>
    [HttpDelete("{sessionId}")]
    public async Task<IActionResult> DeleteInterview(int sessionId)
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

        var isDeleted = await _interviewService.DeleteInterviewAsync(userId, sessionId);

        if (!isDeleted)
        {
            return NotFound(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Mülakat oturumu bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<string>
        {
            Success = true,
            Message = "Mülakat oturumu başarıyla silindi.",
            Data = null
        });
    }


    /// Bu endpoint, kullanıcının verdiği cevabı yeniden yazmak için kullanılır. Kullanıcı
    /// yalnızca kendi cevaplarını yeniden yazabilir.
    [HttpPost("rewrite-answer")]
    public async Task<IActionResult> RewriteAnswer(RewriteAnswerRequestDto request)
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

        if (string.IsNullOrWhiteSpace(request.QuestionText) ||
            string.IsNullOrWhiteSpace(request.UserAnswer))
        {
            return BadRequest(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Soru metni ve kullanıcı cevabı boş olamaz.",
                Data = null
            });
        }

        var result = await _aiAnswerRewriteService.RewriteAnswerAsync(request);

        return Ok(new ApiResponseDto<RewriteAnswerResponseDto>
        {
            Success = true,
            Message = "Cevap başarıyla yeniden yazıldı.",
            Data = result
        });
    }
}


