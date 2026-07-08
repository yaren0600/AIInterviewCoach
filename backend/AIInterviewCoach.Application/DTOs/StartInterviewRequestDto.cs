using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Posizyon için geçerli değerler kontrolü sağlanır
/// </summary>
public class StartInterviewRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "PositionId must be greater than 0.")]
    public int PositionId { get; set; }

    public int? ResumeId { get; set; }

    [Range(5, 15, ErrorMessage = "Question count must be between 5 and 15.")]
    public int QuestionCount { get; set; } = 8;

    [Required]
    public string Difficulty { get; set; } = "Intermediate";

    [Required]
    public string InterviewMode { get; set; } = "Mixed";

    public string? ProgrammingLanguage { get; set; } 
}
//Idye göre kullanıcı hangi pozisyonda mülakat başlatmak istiyoor onu anlayacak

