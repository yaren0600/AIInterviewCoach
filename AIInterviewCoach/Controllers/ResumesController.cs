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
    

    /// <summary>
    /// Bu endpoint 1 numaralı CV bu kullanıcıya mı ait? CV metni var mı?
    /// Becerileri tespit et Eksik becerileri çıkar Pozisyon öner Analiz sonucunu döndür
    /// </summary>
    /// <param name="resumeId"></param>
    /// 
    [HttpGet("{resumeId}/analysis")]
    public async Task<IActionResult> AnalyzeResume(int resumeId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null)
        {
            return Unauthorized("Kullanıcı bilgisi alınamadı.");
        }

        var userId = int.Parse(userIdClaim);

        var result = await _resumeService.AnalyzeResumeAsync(userId, resumeId);

        if (result is null)
        {
            return NotFound("CV bulunamadı veya bu kullanıcıya ait değil.");
        }

        return Ok(result);
    }
}