using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Domain.Entities;
using AIInterviewCoach.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AIInterviewCoach.Infrastructure.Services;

public class PositionService : IPositionService
{
    private readonly AppDbContext _context;

    public PositionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PositionDto>> GetAllAsync()
    {
        var positions = await _context.Positions
            .Select(position => new PositionDto
            {
                Id = position.Id,
                Name = position.Name,
                Description = position.Description
            })
            .ToListAsync();

        return positions;
    }

    public async Task<string> SeedPositionsAsync()
    {
        var hasPositions = await _context.Positions.AnyAsync();

        if (hasPositions)
        {
            return "Pozisyonlar zaten mevcut.";
        }

        var positions = new List<Position>
        {
            new Position
            {
                Name = "Backend Developer",
                Description = "API, veritabanı, authentication ve server-side geliştirme odaklı mülakat."
            },
            new Position
            {
                Name = "Data Analyst",
                Description = "SQL, veri analizi, raporlama, dashboard ve temel istatistik odaklı mülakat."
            },
            new Position
            {
                Name = "DevOps Engineer",
                Description = "Linux, Docker, CI/CD, deployment ve sistem yönetimi odaklı mülakat."
            },
            new Position
            {
                Name = "Business Analyst",
                Description = "Requirement analysis, user story, süreç analizi ve dokümantasyon odaklı mülakat."
            },
            new Position
            {
                Name = "Software Engineer",
                Description = "Genel yazılım geliştirme, algoritma, OOP, API ve veritabanı odaklı mülakat."
            }
        };

        _context.Positions.AddRange(positions);
        await _context.SaveChangesAsync();

        return "Pozisyonlar başarıyla eklendi.";
    }
    }
