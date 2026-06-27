using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class SubmitAnswerRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir soru seçilmelidir.")]
    public int QuestionId { get; set; }

    [Required(ErrorMessage = "Cevap alanı zorunludur.")]
    public string UserAnswer { get; set; } = string.Empty;
}
