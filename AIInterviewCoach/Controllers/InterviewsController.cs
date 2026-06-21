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
            return Unauthorized("Kullanıcı bilgisi alınamadı.");
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.StartInterviewAsync(userId, request);

        if (result is null)
        {
            return BadRequest("Geçersiz pozisyon seçimi.");
        }

        return Ok(result);
    }

    [HttpPost("answer")]
    public async Task<IActionResult> SubmitAnswer(SubmitAnswerRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized("Kullanıcı bilgisi alınamadı.");
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.SubmitAnswerAsync(userId, request);

        if (result is null)
        {
            return BadRequest("Soru bulunamadı veya bu kullanıcıya ait değil.");
        }

        return Ok(result);
    }

    [HttpGet("{sessionId}/result")]
    public async Task<IActionResult> GetResult(int sessionId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized("Kullanıcı bilgisi alınamadı.");
        }

        var userId = int.Parse(userIdClaim);

        var result = await _interviewService.GetInterviewResultAsync(userId, sessionId);

        if (result is null)
        {
            return NotFound("Mülakat oturmu bulunamadı veya bu kullanıcıya ait değil!!");
        }

        return Ok(result);
    }

    [HttpGet("my-sessions")]
    public async Task<IActionResult> GetMySessions()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized("Kullanıcı bilgisi alınamadı.");

        }

        var userId = int.Parse(userIdClaim);//Parse ile string olarak gelen userId'yi int'e çeviriyoruz.

        var result = await _interviewService.GetMySessionsAsync(userId);

        return Ok(result);
        //Bu controller’ın üstünde zaten [Authorize] olduğu için bu endpoint de token isteyecek.

    }
}


