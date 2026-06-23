using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Domain.Entities;

/// <summary>
/// Bir kullanıcının birden fazla CV yükleme kaydı olabilir.
/// </summary>
public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public ICollection<InterviewSession> InterviewSessions { get; set; } = new List<InterviewSession>();
    public ICollection<Resume> Resumes { get; set; } = new List<Resume>();

}
