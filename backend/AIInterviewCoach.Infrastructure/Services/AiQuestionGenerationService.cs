using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;

namespace AIInterviewCoach.Infrastructure.Services;

public class AiQuestionGenerationService : IAiQuestionGenerationService
{
    public Task<List<AiGeneratedQuestionDto>> GenerateQuestionsAsync(
        string positionName,
        string interviewMode,
        string difficulty,
        int questionCount,
        string? programmingLanguage,
        string? resumeContent)
    {
        var questions = GenerateMockQuestions(
            positionName,
            interviewMode,
            difficulty,
            questionCount,
            programmingLanguage,
            resumeContent);

        return Task.FromResult(questions);
    }

    private static List<AiGeneratedQuestionDto> GenerateMockQuestions(
        string positionName,
        string interviewMode,
        string difficulty,
        int questionCount,
        string? programmingLanguage,
        string? resumeContent)
    {
        var normalizedMode = interviewMode.Trim().ToLower();
        var normalizedLanguage = string.IsNullOrWhiteSpace(programmingLanguage)
            ? "C#"
            : programmingLanguage.Trim();

        var questions = new List<AiGeneratedQuestionDto>();

        for (var i = 1; i <= questionCount; i++)
        {
            questions.Add(CreateMockQuestion(
                i,
                positionName,
                normalizedMode,
                difficulty,
                normalizedLanguage,
                resumeContent));
        }

        return questions;
    }

    private static AiGeneratedQuestionDto CreateMockQuestion(
        int index,
        string positionName,
        string normalizedMode,
        string difficulty,
        string programmingLanguage,
        string? resumeContent)
    {
        return normalizedMode switch
        {
            "behavioral" => new AiGeneratedQuestionDto
            {
                QuestionText = $"Tell me about a time when you solved a difficult problem while working as a {positionName}.",
                Category = "Behavioral",
                Difficulty = difficulty,
                ExpectedAnswerGuide = "A strong answer should use the STAR method: Situation, Task, Action, and Result."
            },

            "technical" => new AiGeneratedQuestionDto
            {
                QuestionText = $"Explain an important technical concept used in the {positionName} role and give a practical example.",
                Category = "Technical",
                Difficulty = difficulty,
                ExpectedAnswerGuide = "A strong answer should include a clear definition, use case, and project-based example."
            },

            "sql-practice" => new AiGeneratedQuestionDto
            {
                QuestionText = "Write an SQL query that lists customers who have more than 3 orders, including their customer name and total order count.",
                Category = "SQL Practice",
                Difficulty = difficulty,
                ExpectedAnswerGuide = "A strong answer should use GROUP BY, COUNT, and HAVING correctly."
            },

            "coding-practice" => new AiGeneratedQuestionDto
            {
                QuestionText = $"Using {programmingLanguage}, write a function that finds the second largest number in an integer array.",
                Category = $"Coding Practice - {programmingLanguage}",
                Difficulty = difficulty,
                ExpectedAnswerGuide = "A strong answer should handle edge cases, avoid unnecessary sorting if possible, and explain the time complexity."
            },

            "cv-based" => new AiGeneratedQuestionDto
            {
                QuestionText = string.IsNullOrWhiteSpace(resumeContent)
                    ? $"Based on your background, explain which skill makes you suitable for the {positionName} role."
                    : $"Based on your CV, explain one project or skill that makes you suitable for the {positionName} role.",
                Category = "CV-Based",
                Difficulty = difficulty,
                ExpectedAnswerGuide = "A strong answer should connect the candidate's CV experience with the target role."
            },

            _ => new AiGeneratedQuestionDto
            {
                QuestionText = $"What makes you a strong candidate for the {positionName} position? Give a concrete example.",
                Category = "Mixed",
                Difficulty = difficulty,
                ExpectedAnswerGuide = "A strong answer should combine technical skills, communication, and a concrete project or work example."
            }
        };
    }
}