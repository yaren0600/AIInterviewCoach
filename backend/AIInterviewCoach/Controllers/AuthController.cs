using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;


namespace AIInterviewCoach.Controllers;
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);

        if (result == "Bu email adresi zaten kayıtlı.")
        {
            return BadRequest(new ApiResponseDto<string>
            {
                Success = false,
                Message = result,
                Data = null
            });
        }

        return Ok(new ApiResponseDto<string>
        {
            Success = true,
            Message = result,
            Data = result
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == "Email veya şifre hatalı.")
        {
            return Unauthorized(new ApiResponseDto<string>
            {
                Success = false,
                Message = result,
                Data = null
            });
        }

        return Ok(new ApiResponseDto<LoginResponseDto>
        {
            Success = true,
            Message = "Giriş başarılı.",
            Data = new LoginResponseDto
            {
                Token = result
            }
        });
    }

    [Authorize]
    [HttpGet("profile")]
    public IActionResult Profile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        var profile = new ProfileResponseDto
        {
            UserId = userId,
            Name = name,
            Email = email
        };

        return Ok(new ApiResponseDto<ProfileResponseDto>
        {
            Success = true,
            Message = "Profil bilgileri başarıyla getirildi.",
            Data = profile
        });
    }

    [Authorize]
    [HttpDelete("delete-account")]
    public async Task<IActionResult> DeleteAccount(DeleteAccountRequestDto request)
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

        var isDeleted = await _authService.DeleteAccountAsync(userId, request.Password);

        if (!isDeleted)
        {
            return BadRequest(new ApiResponseDto<string>
            {
                Success = false,
                Message = "Şifre hatalı veya kullanıcı bulunamadı.",
                Data = null
            });
        }

        return Ok(new ApiResponseDto<string>
        {
            Success = true,
            Message = "Hesabınız başarıyla silindi.",
            Data = null
        });
    }
}
