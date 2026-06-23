using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// Bu DTO, CV yüklendikten sonra kullanıcıya döneceğimiz response modelidir.
/// </summary>
public class ResumeDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType {  get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string? ExtractedText {  get; set; }
}
