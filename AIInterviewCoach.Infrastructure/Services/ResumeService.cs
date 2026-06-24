using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Domain.Entities;
using AIInterviewCoach.Infrastructure.Persistence;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using UglyToad.PdfPig;

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

        var extractedText = ExtractTextFromFile(filePath, file.ContentType);

        var resume = new Resume
        {
            UserId = userId,
            FileName = file.FileName,
            FilePath = filePath,
            ContentType = file.ContentType,
            UploadedAt = DateTime.Now,
            ExtractedText = extractedText
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

    /// <summary>
    /// Dosya PDF ise → PDF okuma metoduna gönder
    /// Dosya DOCX ise → DOCX okuma metoduna gönder
    /// Diğer dosya türüyse → null dön
    /// </summary>
    /// <param name="filePath"></param>
    /// <param name="contentType"></param>
    private string? ExtractTextFromFile(string filePath, string contentType)
    {
        if (contentType == "application/pdf")
        {
            return ExtractTextFromPdf(filePath);
        }

        if (contentType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        {
            return ExtractTextFromDocx(filePath);
        }

        return null;
    }

    /// <summary>
    /// Bu metot PDF dosyasını açıyor, sayfaları tek tek dolaşıyor
    /// sayfanın metnini birleştiriyor OCR işlemi değil bu metin okuma işlemi
    /// </summary>
    /// <param name="filePath"></param>
    /// <returns></returns>
    private string ExtractTextFromPdf(string filePath)
    {
        var textBuilder = new StringBuilder();

        using var document = PdfDocument.Open(filePath);

        foreach (var page in document.GetPages())
        {
            textBuilder.AppendLine(page.Text);
        }

        return textBuilder.ToString();
    }

    /// <summary>
    /// Bu metot Word dosyasını açıyor ve ana gövdedeki metni alıyor.
    /// </summary>
    /// <param name="filePath"></param>
    private string ExtractTextFromDocx(string filePath)
    {
        using var wordDocument = WordprocessingDocument.Open(filePath, false);

        var body = wordDocument.MainDocumentPart?.Document.Body;

        return body?.InnerText ?? string.Empty;
    }
}