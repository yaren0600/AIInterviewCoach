using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace AIInterviewCoach.Infrastructure.Services;

public class StudyPlanAiService : IStudyPlanAiService
{
    private readonly AiProviderSettings _aiProviderSettings;
    private readonly HttpClient _httpClient;

    public StudyPlanAiService(
        IOptions<AiProviderSettings> aiProviderSettings,
        HttpClient httpClient)
    {
        _aiProviderSettings = aiProviderSettings.Value;
        _httpClient = httpClient;
    }

    public async Task<StudyPlanDto?> GenerateStudyPlanAsync(StudyPlanAiInputDto input)
    {
        if (!_aiProviderSettings.Provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        try
        {
            if (string.IsNullOrWhiteSpace(_aiProviderSettings.ApiKey) ||
                string.IsNullOrWhiteSpace(_aiProviderSettings.Model))
            {
                return null;
            }

            var prompt = BuildStudyPlanPrompt(input);

            var endpoint = string.IsNullOrWhiteSpace(_aiProviderSettings.Endpoint)
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{_aiProviderSettings.Model}:generateContent"
                : $"{_aiProviderSettings.Endpoint.TrimEnd('/')}/v1beta/models/{_aiProviderSettings.Model}:generateContent";

            var request = new GeminiGenerateContentRequest
            {
                Contents = new List<GeminiContent>
    {
        new()
        {
            Parts = new List<GeminiPart>
            {
                new()
                {
                    Text = prompt
                }
            }
        }
    },
                GenerationConfig = new GeminiGenerationConfig
                {
                    Temperature = 1.25,
                    TopP = 0.95,
                    TopK = 40
                }
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = JsonContent.Create(request)
            };

            httpRequest.Headers.Add("x-goog-api-key", _aiProviderSettings.ApiKey);

            var response = await _httpClient.SendAsync(httpRequest);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Gemini study plan generation failed: {(int)response.StatusCode} - {errorContent}");
                return null;
            }

            var geminiResponse =
                await response.Content.ReadFromJsonAsync<GeminiGenerateContentResponse>();

            var responseText = geminiResponse?
                .Candidates?
                .FirstOrDefault()?
                .Content?
                .Parts?
                .FirstOrDefault()?
                .Text;

            if (string.IsNullOrWhiteSpace(responseText))
            {
                return null;
            }

            var cleanedJson = CleanJsonResponse(responseText);

            var studyPlan = JsonSerializer.Deserialize<StudyPlanDto>(
                cleanedJson,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (studyPlan is null)
            {
                return null;
            }

            studyPlan.StrongAreas = EnsureList(studyPlan.StrongAreas);
            studyPlan.WeakAreas = EnsureList(studyPlan.WeakAreas);
            studyPlan.RecommendedPracticeModes = EnsureList(studyPlan.RecommendedPracticeModes);
            studyPlan.TechnicalFocusTopics = EnsureList(studyPlan.TechnicalFocusTopics);
            studyPlan.CommunicationFocusTopics = EnsureList(studyPlan.CommunicationFocusTopics);
            studyPlan.WeeklyPlan = EnsureWeeklyPlan(studyPlan.WeeklyPlan);

            if (string.IsNullOrWhiteSpace(studyPlan.GeneralSummary) ||
                studyPlan.WeeklyPlan.Count == 0)
            {
                return null;
            }

            return studyPlan;
        }
        catch (Exception exception)
        {
            Console.WriteLine($"Gemini study plan generation exception: {exception.Message}");
            return null;
        }
    }

    private static string BuildStudyPlanPrompt(StudyPlanAiInputDto input)
    {
        var strongAreas = string.Join("\n", input.StrongAreas.Select(x => $"- {x}"));
        var weakAreas = string.Join("\n", input.WeakAreas.Select(x => $"- {x}"));
        var recommendedModes = string.Join("\n", input.RecommendedPracticeModes.Select(x => $"- {x}"));
        var technicalTopics = string.Join("\n", input.TechnicalFocusTopics.Select(x => $"- {x}"));
        var communicationTopics = string.Join("\n", input.CommunicationFocusTopics.Select(x => $"- {x}"));
        var categoryPerformances = string.Join("\n", input.CategoryPerformanceSummaries.Select(x => $"- {x}"));

        return $$"""
Sen deneyimli bir yazılım mülakat koçu ve kariyer gelişim danışmanısın.

Aşağıdaki kullanıcının mülakat performans verilerine göre ona özel, uygulanabilir, motive edici ve gerçekçi bir 7 günlük gelişim planı üret.

Veriler:
Toplam mülakat oturumu: {{input.TotalSessions}}
Analiz edilen cevap sayısı: {{input.AnsweredQuestionCount}}
En güçlü kategori: {{input.StrongestCategory}}
En zayıf kategori: {{input.WeakestCategory}}

Kategori performansları:
{{categoryPerformances}}

Güçlü alanlar:
{{strongAreas}}

Gelişim alanları:
{{weakAreas}}

Önerilen pratik modları:
{{recommendedModes}}

Teknik odak konuları:
{{technicalTopics}}

İletişim odak konuları:
{{communicationTopics}}

Yeniden plan oluşturma isteği: {{input.IsRegenerationRequested}}
Plan varyasyon kodu: {{input.RegenerationSeed}}

Kurallar:
- Cevap tamamen Türkçe olmalı.
- Kullanıcı yeni mezun / junior seviyesine yakın düşünülmeli.
- Plan moral bozucu değil, destekleyici olmalı.
- Haftalık plan tam 7 görev içermeli.
- Her görev tek oturuşta yapılabilecek kadar net olmalı.
- Görevler mülakat pratiğine doğrudan katkı sağlamalı.
- Yeni plan oluşturuluyorsa haftalık görevler önceki klasik plana benzememeli.
- “5 soruluk kısa pratik yap”, “STAR tekniğiyle 3 soru cevapla”, “AI geri bildirimlerini incele” gibi genel görevleri aynen tekrar etme.
- Her görev daha spesifik olmalı: konu, süre, çıktı ve uygulanacak yöntem içermeli.
- Görevlerde farklı pratik formatları kullan: mini teknik anlatım, mock interview, proje pitch, hata analizi, SQL/kod pratiği, cevap yeniden yazımı, sesli prova.
- weeklyPlan içindeki her task cümlesi birbirinden belirgin şekilde farklı olmalı.
- Varyasyon kodunu dikkate al ve aynı veriyle bile farklı plan üret: {{input.RegenerationSeed}}
- Sadece geçerli JSON object döndür.
- Markdown kullanma.
- ```json bloğu kullanma.
- Ek açıklama yazma.

JSON formatı:
{
  "generalSummary": "Kullanıcıya özel genel değerlendirme",
  "totalTaskCount": 0,
  "completedTaskCount": 0,
  "developmentProgress": 0,
  "strongAreas": [
    "Güçlü alan 1",
    "Güçlü alan 2"
  ],
  "weakAreas": [
    "Gelişim alanı 1",
    "Gelişim alanı 2"
  ],
  "recommendedPracticeModes": [
    "Mixed",
    "Technical",
    "Behavioral"
  ],
  "technicalFocusTopics": [
    "Teknik odak konusu 1",
    "Teknik odak konusu 2"
  ],
  "communicationFocusTopics": [
    "İletişim odak konusu 1",
    "İletişim odak konusu 2"
  ],
  "weeklyPlan": [
    {
      "id": 0,
      "day": "1. Gün",
      "focus": "Odak başlığı",
      "task": "Net ve uygulanabilir görev açıklaması",
      "practiceMode": "Mixed",
      "isCompleted": false,
      "completedAt": null
    }
  ]
}
""";
    }

    private static string CleanJsonResponse(string responseText)
    {
        var cleaned = responseText.Trim();

        cleaned = Regex.Replace(cleaned, @"^```json\s*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"^```\s*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"\s*```$", "", RegexOptions.IgnoreCase);

        return cleaned.Trim();
    }

    private static List<string> EnsureList(List<string>? items)
    {
        return items?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .ToList() ?? new List<string>();
    }

    private static List<WeeklyStudyPlanItemDto> EnsureWeeklyPlan(List<WeeklyStudyPlanItemDto>? items)
    {
        return items?
            .Where(x =>
                !string.IsNullOrWhiteSpace(x.Day) &&
                !string.IsNullOrWhiteSpace(x.Focus) &&
                !string.IsNullOrWhiteSpace(x.Task))
            .Take(7)
            .Select((x, index) => new WeeklyStudyPlanItemDto
            {
                Id = 0,
                Day = string.IsNullOrWhiteSpace(x.Day) ? $"{index + 1}. Gün" : x.Day,
                Focus = x.Focus,
                Task = x.Task,
                PracticeMode = string.IsNullOrWhiteSpace(x.PracticeMode) ? "Mixed" : x.PracticeMode,
                IsCompleted = false,
                CompletedAt = null
            })
            .ToList() ?? new List<WeeklyStudyPlanItemDto>();
    }

    private class GeminiGenerateContentRequest
    {
        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();

        [JsonPropertyName("generationConfig")]
        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    private class GeminiGenerationConfig
    {
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        [JsonPropertyName("topP")]
        public double TopP { get; set; }

        [JsonPropertyName("topK")]
        public int TopK { get; set; }
    }

    private class GeminiContent
    {
        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();
    }

    private class GeminiPart
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    private class GeminiGenerateContentResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    private class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
}