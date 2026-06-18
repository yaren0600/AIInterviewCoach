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
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;


namespace AIInterviewCoach.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration; 
    }

    public async Task<string> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == request.Email);

        if (existingUser is not null)
        {
            return "Bu email adresi zaten kayıtlı.";
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            CreatedAt = DateTime.Now
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return "Kullanıcı başarıyla oluşturuldu.";
    }

    private string HashPassword(string password)
    {
        //Bu metot , kullanıcının şifresini güvenli bir şekilde saklamak için kullanılacak. Şifreler asla düz metin olarak saklanmamalıdır. Bunun yerine, şifreler hashlenerek saklanır.
        //Hashleme işlemi, şifrenin geri döndürülemez bir şekilde dönüştürülmesini sağlar. Böylece, veritabanına sızan kötü niyetli kişiler şifreleri elde edemezler.
        using var sha256 = SHA256.Create();

        var bytes = Encoding.UTF8.GetBytes(password);
        var hashBytes = sha256.ComputeHash(bytes);

        return Convert.ToBase64String(hashBytes);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Name),
        new Claim(ClaimTypes.Email, user.Email)
    };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var expireMinutes = Convert.ToDouble(_configuration["Jwt:ExpireMinutes"]);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(expireMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<string> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == request.Email);

        if (user is null)
        {
            return "Email veya şifre hatalı.";
        }

        //HashPassword metodu loginde de registerda da kullanılıyor.
        //Çünkü kullanıcı login olurken gelen şifreyi yeniden hashleyeceğiz ve veritabanındaki hash ile karşılaştıracağız.
        //Eğer kullanıcı doğru şifreyi girdiyse, her iki hash aynı olacaktır ve kullanıcı başarılı bir şekilde giriş yapabilecektir.


        var passwordHash = HashPassword(request.Password);

        if (user.PasswordHash != passwordHash)
        {
            return "Email veya şifre hatalı.";
        }

        var token = GenerateJwtToken(user);
        return token;
    }
}