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
}