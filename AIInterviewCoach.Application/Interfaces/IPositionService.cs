using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AIInterviewCoach.Application.DTOs;

namespace AIInterviewCoach.Application.Interfaces;

public interface IPositionService
{
    Task<List<PositionDto>> GetAllAsync();
    Task<string> SeedPositionsAsync();
}

//GetAllAsync → Pozisyonları listele
//SeedPositionsAsync → İlk pozisyonları veritabanına ekle