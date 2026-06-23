using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIInterviewCoach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ResumesController : ControllerBase
{
    private readonly IResumeService _resumeService;

    public ResumesController(IResumeService resumeService)
    {
        _resumeService = resumeService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadResume(IFormFile file)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized("Kullanıcı bilgisi alınamadı.");
        }

        var userId = int.Parse(userIdClaim);

        var result = await _resumeService.UploadResumeAsync(userId, file);

        if (result is null)
        {
            return BadRequest("Dosya yüklenemedi. Lütfen PDF veya DOCX formatında geçerli bir dosya seç.");
        }

        return Ok(result);
    }

    [HttpGet("my-resumes")]
    public async Task<IActionResult> GetMyResumes()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized("Kullanıcı bilgisi alınamadı.");
        }

        var userId = int.Parse(userIdClaim);

        var result = await _resumeService.GetMyResumesAsync(userId);

        return Ok(result);
    }
}