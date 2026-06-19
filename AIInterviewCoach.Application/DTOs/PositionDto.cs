using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class PositionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
//Veritabanındaki Position entity’sini direkt dışarı açmak yerine, kullanıcıya sadece gerekli alanları döndürüyoruz.