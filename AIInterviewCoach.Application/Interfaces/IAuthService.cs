using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AIInterviewCoach.Application.DTOs;

// Bu interfacei oluşturma amacımız, uygulamanın farklı yerlerinde authentication işlemlerini gerçekleştirecek bir servis tanımlamak.
// //Bu servis, kullanıcıların kimlik doğrulama işlemlerini yönetmek için kullanılacak ve farklı implementasyonlar sağlayabilir.
// Örneğin, JWT tabanlı bir authentication sistemi veya OAuth tabanlı bir sistem gibi farklı yöntemler kullanılabilir.
// Bu interface sayesinde, uygulamanın farklı bölümlerinde authentication işlemleri için tek bir standart arayüz kullanılabilir
// ve bu da kodun daha modüler ve test edilebilir olmasını sağlar.


namespace AIInterviewCoach.Application.Interfaces;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterRequestDto registerRequestDto);
}

//Burada Task<string> dememizin sebebi:
//işlem asenkron çalışacak
//sonuç olarak bize mesaj dönecek

//Mesela:Kullanıcı başarıyla oluşturuldu.