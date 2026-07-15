using System.ComponentModel.DataAnnotations;

namespace AIInterviewCoach.Application.DTOs;

public class DeleteAccountRequestDto
{
    [Required(ErrorMessage = "Şifre zorunludur.")]
    public string Password { get; set; } = string.Empty;
}