using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class MyInterviewSessionDto
{
    public int Id { get; set; }
    public string PositionName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? TotalScore { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public string Status { get; set; } = string.Empty;
}

//Burada status bize oturumun durumunu göstermek için kullanılır.
//Örneğin, "In Progress", "Completed", "Scheduled" gibi değerler alabilir.
//Bu sayede kullanıcılar oturumlarının hangi aşamada olduğunu kolayca görebilirler.