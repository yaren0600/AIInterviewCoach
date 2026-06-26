using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIInterviewCoach.Controllers;

/// <summary>
/// Frontend veya Swagger’dan gelen dashboard isteğini karşılar, 
/// token’dan kullanıcıyı bulur ve dashboard verisini döndürür.
/// </summary>

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
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

        var result = await _dashboardService.GetDashboardAsync(userId);

        return Ok(new ApiResponseDto<DashboardDto>
        {
            Success = true,
            Message = "Dashboard bilgileri başarıyla getirildi.",
            Data = result
        });
    }
}