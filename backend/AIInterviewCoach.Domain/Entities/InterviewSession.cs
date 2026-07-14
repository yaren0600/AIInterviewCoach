using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Domain.Entities;

public class InterviewSession
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; }
    public int PositionId { get; set; }
    public Position Position { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? TotalScore { get; set; }
    public ICollection<Question> Questions { get; set; } = new List<Question>();

}

//Burada CompletedAt ve TotalScore neden nullable?
//Çünkü mülakat başladığında henüz bitmemiş olabilir.
//Daha sonra bitince bu alanlar dolacak.
