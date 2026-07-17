using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Settings;
using Microsoft.Extensions.Options;

namespace AIInterviewCoach.Infrastructure.Services;

public class AiAnswerRewriteService : IAiAnswerRewriteService
{
    private readonly HttpClient _httpClient;
    private readonly AiProviderSettings _aiProviderSettings;

    public AiAnswerRewriteService(
        HttpClient httpClient,
        IOptions<AiProviderSettings> aiProviderSettings)
    {
        _httpClient = httpClient;
        _aiProviderSettings = aiProviderSettings.Value;
    }

    public async Task<RewriteAnswerResponseDto> RewriteAnswerAsync(
        RewriteAnswerRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.UserAnswer))
        {
            return new RewriteAnswerResponseDto
            {
                RewrittenAnswer = "Bu soru için geliştirilecek bir cevap bulunamadı.",
                ImprovementNote = "Cevap alanı boş olduğu için yeniden yazım yapılamadı."
            };
        }

        if (_aiProviderSettings.Provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            return await RewriteWithGeminiAsync(request);
        }

        return RewriteWithMock(request);
    }

    private async Task<RewriteAnswerResponseDto> RewriteWithGeminiAsync(
        RewriteAnswerRequestDto request)
    {
        try
        {
            var prompt = BuildPrompt(request);

            var geminiRequest = new GeminiGenerateContentRequest
            {
                Contents =
                [
                    new GeminiContent
                    {
                        Parts =
                        [
                            new GeminiPart
                            {
                                Text = prompt
                            }
                        ]
                    }
                ],
                GenerationConfig = new GeminiGenerationConfig
                {
                    Temperature = 0.75,
                    TopP = 0.9,
                    TopK = 40
                }
            };

            var endpoint = string.IsNullOrWhiteSpace(_aiProviderSettings.Endpoint)
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{_aiProviderSettings.Model}:generateContent"
                : $"{_aiProviderSettings.Endpoint.TrimEnd('/')}/v1beta/models/{_aiProviderSettings.Model}:generateContent";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint);
            httpRequest.Headers.Add("x-goog-api-key", _aiProviderSettings.ApiKey);
            httpRequest.Content = JsonContent.Create(geminiRequest);

            var response = await _httpClient.SendAsync(httpRequest);

            if (!response.IsSuccessStatusCode)
            {
                return RewriteWithMock(request);
            }

            var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiGenerateContentResponse>();

            var text = geminiResponse?
                .Candidates?
                .FirstOrDefault()?
                .Content?
                .Parts?
                .FirstOrDefault()?
                .Text;

            if (string.IsNullOrWhiteSpace(text))
            {
                return RewriteWithMock(request);
            }

            return ParseAiResponse(text);
        }
        catch
        {
            return RewriteWithMock(request);
        }
    }

    private static RewriteAnswerResponseDto RewriteWithMock(RewriteAnswerRequestDto request)
    {
        var category = request.Category?.Trim() ?? "";
        var userAnswer = request.UserAnswer?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return new RewriteAnswerResponseDto
            {
                RewrittenAnswer = "Bu soru için geliştirilecek bir cevap bulunamadı.",
                ImprovementNote = "Cevap boş olduğu için yeniden yazım yapılamadı."
            };
        }

        var isBehavioral =
            category.Contains("Behavioral", StringComparison.OrdinalIgnoreCase) ||
            request.QuestionText.Contains("anlatır mısınız", StringComparison.OrdinalIgnoreCase) ||
            request.QuestionText.Contains("bir anı", StringComparison.OrdinalIgnoreCase) ||
            request.QuestionText.Contains("deneyim", StringComparison.OrdinalIgnoreCase);

        if (isBehavioral)
        {
            return new RewriteAnswerResponseDto
            {
                RewrittenAnswer =
                    "Bu soruya daha güçlü bir cevap verirken durumu, yaptığım aksiyonu ve öğrendiğim sonucu net şekilde anlatırdım.\n\n" +
                    "Örneğin, bir analiz sürecinde veya hazırladığım bir belgede hata fark ettiğimde önce hatanın etkisini anlamaya çalıştım. " +
                    "Ardından ilgili kısmı tekrar kontrol edip gerekli düzeltmeyi yaptım. Eğer bu hata ekip çalışmasını veya teslim sürecini etkiliyorsa, durumu açık şekilde paylaşarak çözüm önerisi sundum. " +
                    "Bu deneyim bana yaptığım işi teslim etmeden önce tekrar kontrol etmenin, geri bildirime açık olmanın ve hatayı sahiplenerek hızlıca çözmenin ne kadar önemli olduğunu gösterdi.",

                ImprovementNote =
                    "Bu tarz behavioral sorularda cevabını daha güçlü göstermek için STAR yapısını kullan: durum, görev, aksiyon ve sonuç. Sadece 'örneğin' demek yerine gerçek bir olay, yaptığın düzeltme ve öğrendiğin dersi mutlaka ekle."
            };
        }

        return new RewriteAnswerResponseDto
        {
            RewrittenAnswer =
                "Bu soruya daha güçlü bir cevap verirken önce kavramı kısa ve net tanımlar, ardından gerçek bir proje veya örnek üzerinden nasıl kullandığımı anlatırdım.\n\n" +
                $"{userAnswer}\n\n" +
                "Bu cevabı daha profesyonel hale getirmek için kullanılan teknoloji, karşılaşılan problem, uygulanan çözüm ve elde edilen sonucu birlikte açıklamak daha etkili olur.",

            ImprovementNote =
                "Teknik cevaplarda sadece tanım yapmak yerine problemi, kullandığın yaklaşımı ve sonuca katkısını birlikte anlatman cevabını daha güçlü gösterir."
        };
    }

    private static string BuildPrompt(RewriteAnswerRequestDto request)
    {
        return $$"""
        Sen deneyimli bir teknik mülakat koçusun.

        Kullanıcının verdiği mülakat cevabını daha profesyonel, daha net ve daha etkileyici hale getir.

        Kurallar:
        - Cevap Türkçe olmalı.
        - Aşırı uzun olmasın.
        - Mülakatta söylenebilecek doğal bir dil kullan.
        - Cevabı tamamen uydurma bilgilerle doldurma.
        - Kullanıcının mevcut cevabını temel al.
        - Teknik cevaplarda gerekirse yapılandırılmış anlatım kullan.
        - Behavioral cevaplarda STAR tekniğine yakın bir yapı kullan.
        - Sadece JSON döndür.
        - Markdown kullanma.

        JSON formatı:
        {
          "rewrittenAnswer": "Daha güçlü cevap buraya",
          "improvementNote": "Kısa gelişim notu buraya"
        }

        Pozisyon:
        {{request.PositionName}}

        Kategori:
        {{request.Category}}

        Soru:
        {{request.QuestionText}}

        Kullanıcının cevabı:
        {{request.UserAnswer}}
        """;
    }

    private static RewriteAnswerResponseDto ParseAiResponse(string text)
    {
        try
        {
            var cleanedText = text
                .Replace("```json", "")
                .Replace("```", "")
                .Trim();

            var result = JsonSerializer.Deserialize<RewriteAnswerResponseDto>(
                cleanedText,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (result is null)
            {
                return new RewriteAnswerResponseDto
                {
                    RewrittenAnswer = text,
                    ImprovementNote = "AI cevabı işlendi ancak JSON formatı tam okunamadı."
                };
            }

            return result;
        }
        catch
        {
            return new RewriteAnswerResponseDto
            {
                RewrittenAnswer = text,
                ImprovementNote = "AI cevabı işlendi ancak yapılandırılmış formata dönüştürülemedi."
            };
        }
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