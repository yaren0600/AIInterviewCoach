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
}