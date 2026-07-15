using AIInterviewCoach.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace AIInterviewCoach.Application.Interfaces;

public interface IResumeService
{
    Task<ResumeDto?> UploadResumeAsync(int userId, IFormFile file);
    Task<List<ResumeDto>> GetMyResumesAsync(int userId);
    Task<ResumeAnalysisDto?> AnalyzeResumeAsync(int userId, int resumeId);// userId gönderiyoruz bu sayede kullanıcı sadece kendi CV'sini analiz edebilmeli
    Task<bool> DeleteResumeAsync(int userId, int resumeId);
}
