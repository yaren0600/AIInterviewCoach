using AIInterviewCoach.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIInterviewCoach.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PositionsController : ControllerBase
{
    private readonly IPositionService _positionService;

    public PositionsController(IPositionService positionService)
    {
        _positionService = positionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var positions = await _positionService.GetAllAsync();

        return Ok(positions);
    }

    [Authorize]
    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        var result = await _positionService.SeedPositionsAsync();

        return Ok(result);
    }
}