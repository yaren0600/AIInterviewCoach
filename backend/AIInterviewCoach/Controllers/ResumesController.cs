using AIInterviewCoach.Application.DTOs;
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
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Kullanıcı bilgisi alınamadı.",
                Data = null
            });
        }

        var userId = int.Parse(userIdClaim);

        var result = await _resumeService.UploadResumeAsync(userId, file);

        if (result is null)
        {
            return BadRequest(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Dosya yüklenemedi. Lütfen PDF veya DOCX formatında geçerli bir dosya seç.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<ResumeDto>
        {
            Success = true,
            Message = "CV başarıyla yüklendi ve metin çıkarma işlemi tamamlandı.",
            Data = result
        });
    }

    [HttpGet("my-resumes")]
    public async Task<IActionResult> GetMyResumes()
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

        var result = await _resumeService.GetMyResumesAsync(userId);

        return Ok(new ApiResponseDto<List<ResumeDto>>
        {
            Success = true,
            Message = "CV listesi başarıyla getirildi.",
            Data = result
        });
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
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Kullanıcı bilgisi alınamadı.",
                Data = null
            });
        }

        var userId = int.Parse(userIdClaim);

        var result = await _resumeService.AnalyzeResumeAsync(userId, resumeId);

        if (result is null)
        {
            return NotFound(new ApiResponseDto<string>
            {
                Success = false,
                Message = "CV bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<ResumeAnalysisDto>
        {
            Success = true,
            Message = "CV analizi başarıyla oluşturuldu.",
            Data = result
        });
    }

    [HttpDelete("{resumeId}")]
    public async Task<IActionResult> DeleteResume(int resumeId)
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

        var isDeleted = await _resumeService.DeleteResumeAsync(userId, resumeId);

        if (!isDeleted)
        {
            return NotFound(new ApiResponseDto<string>
            {
                Success = false,
                Message = "CV bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<string>
        {
            Success = true,
            Message = "CV başarıyla silindi.",
            Data = null
        });
    }
}