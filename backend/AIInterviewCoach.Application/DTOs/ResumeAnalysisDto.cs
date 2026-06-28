using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Bu DTO analiz sonucunu frontende ya da Swagger'a döndürecek
/// </summary>
public class ResumeAnalysisDto
{
    public int ResumeId { get; set; } //hangi cv
    public string FileName { get; set; } = string.Empty; //CV dosya adı
    public List<string> DetectedSkills { get; set; } = new(); //Cv içindeki beceriler
    public List<string> MissingSkills { get; set; } = new(); // Eksik olan eklense iyi olacak beceriler
    public List<string> SuggestedPositions { get; set; } = new(); // Bu CV'ye uygun pozisyon önerileri
    public string Summary {  get; set; } = string.Empty; // Kısa analiz özeti

}
