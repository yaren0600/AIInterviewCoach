using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Domain.Entities;
using AIInterviewCoach.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AIInterviewCoach.Infrastructure.Services;

public class ResumeService : IResumeService
{
    private readonly AppDbContext _context;

    public ResumeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ResumeDto?> UploadResumeAsync(int userId, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return null;
        }

        var allowedContentTypes = new[]
        {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

        if (!allowedContentTypes.Contains(file.ContentType))
        {
            return null;
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Resumes");

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var resume = new Resume
        {
            UserId = userId,
            FileName = file.FileName,
            FilePath = filePath,
            ContentType = file.ContentType,
            UploadedAt = DateTime.Now,
            ExtractedText = null
        };

        _context.Resumes.Add(resume);
        await _context.SaveChangesAsync();

        return new ResumeDto
        {
            Id = resume.Id,
            FileName = resume.FileName,
            FilePath = resume.FilePath,
            ContentType = resume.ContentType,
            UploadedAt = resume.UploadedAt,
            ExtractedText = resume.ExtractedText
        };
    }

    public async Task<List<ResumeDto>> GetMyResumesAsync(int userId)
    {
        var resumes = await _context.Resumes
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.UploadedAt)
            .Select(r => new ResumeDto
            {
                Id = r.Id,
                FileName = r.FileName,
                FilePath = r.FilePath,
                ContentType = r.ContentType,
                UploadedAt = r.UploadedAt,
                ExtractedText = r.ExtractedText
            })
            .ToListAsync();

        return resumes;
    }
}