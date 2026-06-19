using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class QuestionDto
{
    public int Id { get; set; }
    public string QuestionText { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

}
//Bu DTO, kullanıcıya döndüreceğimiz soru bilgisini temsil edecek.