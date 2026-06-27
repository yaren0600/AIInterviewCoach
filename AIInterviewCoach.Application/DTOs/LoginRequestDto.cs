using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace AIInterviewCoach.Application.DTOs;
public class  LoginRequestDto
{
    [Required(ErrorMessage = "Email alanı zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir email adresi girin.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre alanı zorunludur.")]
    public string Password { get; set; } = string.Empty;
}