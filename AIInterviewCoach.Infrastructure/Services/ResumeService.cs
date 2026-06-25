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

    public async Task<ResumeAnalysisDto?> AnalyzeResumeAsync(int userId, int resumeId)
    {
        var resume = await _context.Resumes
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.UserId == userId);

        if (resume is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(resume.ExtractedText))
        {
            return new ResumeAnalysisDto
            {
                ResumeId = resume.Id,
                FileName = resume.FileName,
                Summary = "CV metni çıkarılamadığı için analiz yapılamadı."
            };
        }

        var detectedSkills = DetectSkills(resume.ExtractedText);
        var missingSkills = GetMissingSkills(detectedSkills);
        var suggestedPositions = SuggestPositions(detectedSkills);

        return new ResumeAnalysisDto
        {
            ResumeId = resume.Id,
            FileName = resume.FileName,
            DetectedSkills = detectedSkills,
            MissingSkills = missingSkills,
            SuggestedPositions = suggestedPositions,
            Summary = GenerateSummary(detectedSkills, missingSkills, suggestedPositions)
        };
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

    /// <summary>
    /// Bu metot ile CV metnini küçük harflere çeviriyor. Sonra her beceri için farklı yazım ihtimalleri kontrol ediliyor
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    private List<string> DetectSkills(string text)
    {
        var normalizedText = text.ToLower();

        var skillKeywords = new Dictionary<string, string[]>
    {

        { "C#", new[] { "c#", "c sharp", "csharp" } },
        { "ASP.NET Core", new[] { "asp.net core", ".net core", "aspnet core" } },
        { "SQL", new[] { "sql", "sql server", "mysql", "sqlite", "postgresql" } },
        { "Python", new[] { "python" } },
        { "JavaScript", new[] { "javascript", "js" } },
        { "TypeScript", new[] { "typescript", "ts" } },
        { "HTML", new[] { "html", "html5" } },
        { "CSS", new[] { "css", "css3" } },
        { "React", new[] { "react", "react.js", "reactjs" } },
        { "Next.js", new[] { "next.js", "nextjs", "next js" } },
        { "Entity Framework", new[] { "entity framework", "ef core", "entity framework core" } },
        { "REST API", new[] { "rest api", "restful", "api" } },
        { "JWT", new[] { "jwt", "json web token" } },
        { "Git", new[] { "git", "github", "gitlab" } },
        { "Docker", new[] { "docker", "container" } },
        { "Power BI", new[] { "power bi", "powerbi" } },
        { "Pandas", new[] { "pandas" } },
        { "NumPy", new[] { "numpy" } },
        { "OpenCV", new[] { "opencv", "open cv" } },
        { "Machine Learning", new[] { "machine learning", "makine öğrenmesi", "ml" } },
        { "Data Analysis", new[] { "data analysis", "veri analizi", "data analytics" } },
        { "Agile", new[] { "agile", "scrum", "kanban" } },
        { "C", new[] { " c ", "c programming", "c dili" } },
        { "Java", new[] { "java" } },
        { "Kotlin", new[] { "kotlin" } },
        { "Android", new[] { "android", "android studio" } },
        { "SQLite", new[] { "sqlite" } },
        { "SQL Server", new[] { "sql server", "mssql", "ms sql" } },
        { "MVC", new[] { "mvc", "model view controller" } },
        { "N-Tier Architecture", new[] { "n-tier", "katmanlı mimari", "layered architecture" } },
        { "Clean Architecture", new[] { "clean architecture" } },
        { "Unit Testing", new[] { "unit test", "unit testing", "xunit", "nunit" } },
        { "CI/CD", new[] { "ci/cd", "continuous integration", "continuous deployment" } },
        { "Jira", new[] { "jira" } },
        { "Confluence", new[] { "confluence" } },
        { "Requirement Analysis", new[] { "requirement", "gereksinim analizi", "requirement analysis" } },
        { "User Story", new[] { "user story", "kullanıcı hikayesi" } },
        { "Data Visualization", new[] { "data visualization", "veri görselleştirme", "matplotlib", "seaborn" } }

        };

        var detectedSkills = new List<string>();

        foreach (var skill in skillKeywords)
        {
            var isDetected = skill.Value.Any(keyword =>
                normalizedText.Contains(keyword.ToLower()));

            if (isDetected)
            {
                detectedSkills.Add(skill.Key);
            }
        }

        return detectedSkills
            .Distinct()
            .OrderBy(x => x)
            .ToList();
    }

    /// <summary>
    /// Bu metot CV’de tespit edilmeyen ama junior/backend/data pozisyonlarında faydalı olabilecek becerileri öneriyor.
    /// </summary>
    /// <param name="detectedSkills"></param>
    private List<string> GetMissingSkills(List<string> detectedSkills)
    {
        var recommendedSkills = new List<string>
    {
        "Docker",
        "Unit Testing",
        "CI/CD",
        "Clean Architecture",
        "Cloud Basics",
        "Redis",
        "Message Queue"
    };

        return recommendedSkills
            .Where(skill => !detectedSkills.Contains(skill))
            .ToList();
    }

    /// <summary>
    /// Bu metot CV'deki becerilere göre pozisyon önerir 
    /// </summary>
    /// <param name="detectedSkills"></param>
    private List<string> SuggestPositions(List<string> detectedSkills)
    {
        var suggestedPositions = new List<string>();

        var backendSkills = new[]
        {
        "C#",
        "ASP.NET Core",
        "SQL",
        "Entity Framework",
        "REST API",
        "JWT"
    };

        var dataSkills = new[]
        {
        "Python",
        "SQL",
        "Pandas",
        "NumPy",
        "Power BI",
        "Data Analysis",
        "Machine Learning"
    };

        var frontendSkills = new[]
        {
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js"
    };

        var devopsSkills = new[]
        {
        "Docker",
        "CI/CD",
        "Cloud Basics",
        "Redis",
        "Message Queue"
    };

        var businessAnalystSkills = new[]
        {
        "SQL",
        "Agile",
        "Power BI",
        "Data Analysis",
        "REST API"
    };

        var fullStackSkills = new[]
        {
        "C#",
        "ASP.NET Core",
        "SQL",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "HTML",
        "CSS",
        "REST API"
    };

        var computerVisionSkills = new[]
        {
        "Python",
        "OpenCV",
        "Machine Learning"
    };

        var biSkills = new[]
        {
        "SQL",
        "Power BI",
        "Data Analysis"
    };

        var softwareEngineerSkills = new[]
        {
        "C#",
        "Python",
        "JavaScript",
        "SQL",
        "Git",
        "REST API"
    };

        if (detectedSkills.Any(skill => backendSkills.Contains(skill)))
        {
            suggestedPositions.Add("Backend Developer");
        }

        if (detectedSkills.Any(skill => dataSkills.Contains(skill)))
        {
            suggestedPositions.Add("Data Analyst");
        }

        if (detectedSkills.Any(skill => frontendSkills.Contains(skill)))
        {
            suggestedPositions.Add("Frontend Developer");
        }

        if (detectedSkills.Any(skill => devopsSkills.Contains(skill)))
        {
            suggestedPositions.Add("DevOps Engineer");
        }

        if (detectedSkills.Any(skill => businessAnalystSkills.Contains(skill)))
        {
            suggestedPositions.Add("Business Analyst");
        }

        if (detectedSkills.Count(skill => fullStackSkills.Contains(skill)) >= 4)
        {
            suggestedPositions.Add("Full Stack Developer");
        }

        if (detectedSkills.Any(skill => computerVisionSkills.Contains(skill)))
        {
            suggestedPositions.Add("Computer Vision Developer");
        }

        if (detectedSkills.Any(skill => biSkills.Contains(skill)))
        {
            suggestedPositions.Add("BI Specialist");
        }

        if (detectedSkills.Any(skill => softwareEngineerSkills.Contains(skill)))
        {
            suggestedPositions.Add("Software Engineer");
        }

        if (!suggestedPositions.Any())
        {
            suggestedPositions.Add("Junior Software Developer");
        }

        return suggestedPositions
            .Distinct()
            .OrderBy(x => x)
            .ToList();
    }

    /// <summary>
    /// Bu metot analiz sonucunu okunabilir hale getirir
    /// </summary>
    /// <param name="detectedSkills"></param>
    /// <param name="missingSkills"></param>
    /// <param name="suggestedPositions"></param>
    /// <returns></returns>
    private string GenerateSummary(
    List<string> detectedSkills,
    List<string> missingSkills,
    List<string> suggestedPositions)
    {
        if (!detectedSkills.Any())
        {
            return "CV içinde teknik beceri tespit edilemedi. CV'ye kullanılan teknolojilerin daha açık yazılması önerilir.";
        }

        var skillsText = string.Join(", ", detectedSkills);
        var positionsText = string.Join(", ", suggestedPositions);

        return $"CV içinde {detectedSkills.Count} teknik beceri tespit edildi: {skillsText}. " +
               $"Bu profile uygun olabilecek pozisyonlar: {positionsText}. " +
               $"CV'yi güçlendirmek için eksik beceriler alanındaki teknolojiler eklenebilir.";
    }

}