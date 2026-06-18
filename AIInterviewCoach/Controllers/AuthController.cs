using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;


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
        
        if(result == "Bu email adresi zaten kayıtlı.")
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == "Email veya şifre hatalı.")
        {
            return Unauthorized(result);
        }
        return Ok(new
        {token = result
        
        });
         
    }
}
