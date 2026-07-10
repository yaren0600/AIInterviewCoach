namespace AIInterviewCoach.Infrastructure.Settings;

/// <summary>
/// Bu dosya AI sağlayıcısının yapılandırma ayarlarını tutmak için kullanılan bir sınıf.
///Provider → Gemini / OpenAI / Mock
///ApiKey → gizli API anahtarı
///Model → kullanılacak model adı
///Endpoint → API adresi
/// </summary>

public class AiProviderSettings
{
    public string Provider { get; set; } = "Mock";

    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = string.Empty;

    public string Endpoint { get; set; } = string.Empty;
}