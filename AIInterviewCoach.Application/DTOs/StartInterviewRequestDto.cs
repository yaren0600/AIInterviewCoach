using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.DTOs;

public class StartInterviewRequestDto
{
    public int PositionId { get; set; }
    public int? ResumeId { get; set; }
    // neden int? yaptık: bu sayede CV seçmek zorunlu olmayacak
    //Yani kullanıcı isterse sadece pozisyon seçip mülakat başlatabilir olacak
}
//Idye göre kullanıcı hangi pozisyonda mülakat başlatmak istiyoor onu anlayacak

