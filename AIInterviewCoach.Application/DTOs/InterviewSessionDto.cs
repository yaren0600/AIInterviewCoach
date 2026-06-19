using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class InterviewSessionDto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int PositionId { get; set; }

    public string PositionName { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int? TotalScore { get; set; }
    public List<QuestionDto> Questions { get; set; } = new();

}

//Bu DTO, mülakat başlatılınca kullanıcıya dönecek bilgileri temsil edecek.
