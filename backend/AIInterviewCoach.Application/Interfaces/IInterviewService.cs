using AIInterviewCoach.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIInterviewCoach.Application.Interfaces;


public interface IInterviewService
{
    Task<InterviewSessionDto?> StartInterviewAsync(int userId, StartInterviewRequestDto request);
    Task<AnswerDto?> SubmitAnswerAsync(int userId, SubmitAnswerRequestDto request);
    Task<InterviewResultDto?> GetInterviewResultAsync(int userId, int sessionId);
    Task<List<MyInterviewSessionDto>> GetMySessionsAsync(int userId);
    Task<bool> DeleteInterviewAsync(int userId, int sessionId);
}