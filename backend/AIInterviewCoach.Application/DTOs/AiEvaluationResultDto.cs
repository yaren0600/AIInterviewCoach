namespace AIInterviewCoach.Application.DTOs;

/// <summary>
/// AI cevabı değerlendirdiğinde tek bir düzgün model dönecek
/// puan, feedback, daha güçlü cevap örneği, güçlü noktalar, gelişim noktaları
/// </summary>
/// 
public class AiEvaluationResultDto
{
    public int Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public string BetterAnswerExample { get; set; } = string.Empty;
    public List<string> StrongPoints { get; set; } = new();
    public List<string> ImprovementPoints { get; set; } = new();
}