using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIInterviewCoach.Controllers;

/// <summary>
/// Bu controller, kullanıcının AI gelişim planını almak için gerekli endpoint'i sağlar. 
/// Kullanıcı kimliği JWT token'ından alınır ve 
/// ilgili kullanıcıya ait gelişim planı döndürülür.
/// </summary>

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class StudyPlanController : ControllerBase
{
    private readonly IStudyPlanService _studyPlanService;

    public StudyPlanController(IStudyPlanService studyPlanService)
    {
        _studyPlanService = studyPlanService;
    }

    [HttpGet("my-plan")]
    public async Task<IActionResult> GetMyStudyPlan()
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

        var result = await _studyPlanService.GetMyStudyPlanAsync(userId);

        return Ok(new ApiResponseDto<StudyPlanDto>
        {
            Success = true,
            Message = "AI gelişim planı başarıyla getirildi.",
            Data = result
        });
    }

    [HttpPost("tasks/{taskId}/complete")]
    public async Task<IActionResult> CompleteTask(int taskId)
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

        var isCompleted = await _studyPlanService.CompleteTaskAsync(userId, taskId);

        if (!isCompleted)
        {
            return NotFound(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Görev bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<string>
        {
            Success = true,
            Message = "Görev tamamlandı olarak işaretlendi.",
            Data = null
        });
    }

    [HttpPost("tasks/{taskId}/uncomplete")]
    public async Task<IActionResult> UncompleteTask(int taskId)
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

        var isUncompleted = await _studyPlanService.UncompleteTaskAsync(userId, taskId);

        if (!isUncompleted)
        {
            return NotFound(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Görev bulunamadı veya bu kullanıcıya ait değil.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<string>
        {
            Success = true,
            Message = "Görev tamamlanmadı olarak işaretlendi.",
            Data = null
        });
    }
}