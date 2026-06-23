using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AIInterviewCoach.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace AIInterviewCoach.Application.Interfaces;

public interface IResumeService
{
    Task<ResumeDto?> UploadResumeAsync(int userId, IFormFile file);
    Task<List<ResumeDto>> GetMyResumesAsync(int userId);
}
