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

public class InterviewService : IInterviewService
{
    private readonly AppDbContext _context;

    public InterviewService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<InterviewSessionDto?> StartInterviewAsync(int userId, StartInterviewRequestDto request)
    {
        var position = await _context.Positions
            .FirstOrDefaultAsync(x => x.Id == request.PositionId);

        if (position is null)
        {
            return null;
        }

        var session = new InterviewSession
        {
            UserId = userId,
            PositionId = request.PositionId,
            StartedAt = DateTime.Now,
            CompletedAt = null,
            TotalScore = null
        };

        _context.InterviewSessions.Add(session);
        await _context.SaveChangesAsync();

        var questions = GenerateQuestionsByPosition(position.Name, session.Id);

        _context.Questions.AddRange(questions);
        await _context.SaveChangesAsync();

        return new InterviewSessionDto
        {
            Id = session.Id,
            UserId = session.UserId,
            PositionId = session.PositionId,
            PositionName = position.Name,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            TotalScore = session.TotalScore,
            Questions = questions.Select(q => new QuestionDto

            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                Difficulty = q.Difficulty,
                Category = q.Category
            }).ToList()

        };
    }

    private List<Question> GenerateQuestionsByPosition(string positionName, int sessionId)
    {
        if (positionName == "Backend Developer")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "REST API nedir ve neden kullanılır?",
                Difficulty = "Easy",
                Category = "Backend"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "GET ve POST HTTP metotları arasındaki fark nedir?",
                Difficulty = "Easy",
                Category = "API"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Entity Framework Core nedir ve projede neden kullanılır?",
                Difficulty = "Medium",
                Category = "Database"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "JWT Authentication nasıl çalışır?",
                Difficulty = "Medium",
                Category = "Security"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Dependency Injection nedir ve ASP.NET Core’da nasıl kullanılır?",
                Difficulty = "Medium",
                Category = "Architecture"
            }
        };
        }

        if (positionName == "Data Analyst")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "SQL'de INNER JOIN ve LEFT JOIN arasındaki fark nedir?",
                Difficulty = "Easy",
                Category = "SQL"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Eksik veriyle karşılaştığında nasıl bir analiz süreci izlersin?",
                Difficulty = "Medium",
                Category = "Data Cleaning"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Ortalama, medyan ve standart sapma neyi ifade eder?",
                Difficulty = "Easy",
                Category = "Statistics"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Power BI'da dashboard hazırlarken nelere dikkat edersin?",
                Difficulty = "Medium",
                Category = "BI"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Bir veri setinde aykırı değerleri nasıl tespit edersin?",
                Difficulty = "Medium",
                Category = "EDA"
            }
        };
        }

        if (positionName == "DevOps Engineer")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Docker nedir ve neden kullanılır?",
                Difficulty = "Easy",
                Category = "Docker"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "CI/CD nedir?",
                Difficulty = "Easy",
                Category = "CI/CD"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Linux'ta temel dosya ve süreç yönetimi komutları nelerdir?",
                Difficulty = "Medium",
                Category = "Linux"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Bir uygulama deploy edilirken hangi adımları takip edersin?",
                Difficulty = "Medium",
                Category = "Deployment"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Container ile virtual machine arasındaki fark nedir?",
                Difficulty = "Medium",
                Category = "Infrastructure"
            }
        };
        }

        if (positionName == "Business Analyst")
        {
            return new List<Question>
        {
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Requirement nedir?",
                Difficulty = "Easy",
                Category = "Business Analysis"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Functional ve non-functional requirement arasındaki fark nedir?",
                Difficulty = "Medium",
                Category = "Requirement Analysis"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "User story nasıl yazılır?",
                Difficulty = "Easy",
                Category = "Agile"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Eksik veya belirsiz bir talep geldiğinde nasıl ilerlersin?",
                Difficulty = "Medium",
                Category = "Analysis"
            },
            new Question
            {
                InterviewSessionId = sessionId,
                QuestionText = "Acceptance criteria nedir ve neden önemlidir?",
                Difficulty = "Medium",
                Category = "Documentation"
            }
        };
        }

        return new List<Question>
    {
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "OOP nedir?",
            Difficulty = "Easy",
            Category = "Software"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Veritabanında primary key ve foreign key nedir?",
            Difficulty = "Easy",
            Category = "Database"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "REST API nedir?",
            Difficulty = "Easy",
            Category = "API"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Git ve GitHub ne için kullanılır?",
            Difficulty = "Easy",
            Category = "Version Control"
        },
        new Question
        {
            InterviewSessionId = sessionId,
            QuestionText = "Bir yazılım projesinde hata ayıklama sürecini nasıl yönetirsin?",
            Difficulty = "Medium",
            Category = "Problem Solving"
        }
    };
    }
}