using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Bu şekilde boş ya da yanlış veri gönderilirse sistem hata verecek.
/// </summary>
public class RegisterRequestDto
{
    [Required(ErrorMessage = "İsim alanı zorunludur.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email alanı zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre alanı zorunludur.")]
    [MaxLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
    public string Password { get; set; } = string.Empty;
}