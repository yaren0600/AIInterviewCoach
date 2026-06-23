using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AIInterviewCoach.Domain.Entities;

namespace AIInterviewCoach.Infrastructure.Persistence;

/// <summary>
/// //Burada EF'ye şunu diyoruz 'Benim user isminde bir entity'm var' 
// EF bunu biliyor ve bunu veritabanında Users tablosuna mapliyor.
// Yani public DbSet<User> Users = CREATE TABLE Users demenin C# tarafındaki karşılığıdır
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Position> Positions { get; set; }
    public DbSet<InterviewSession> InterviewSessions { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<Resume> Resumes { get; set; }
}
