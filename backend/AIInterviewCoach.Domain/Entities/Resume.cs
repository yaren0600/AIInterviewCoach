using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Domain.Entities;

/// <summary>
/// Bu tablo kullanıcının yüklediği CV dosyasını temsil edecek.
/// </summary>
public class Resume
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType {  get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string? ExtractedText { get; set; }

}
