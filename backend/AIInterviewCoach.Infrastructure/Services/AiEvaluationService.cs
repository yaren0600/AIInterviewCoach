using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace AIInterviewCoach.Infrastructure.Services;

public class AiEvaluationService : IAiEvaluationService
{
    // appsettings.Development.json içindeki AiProvider ayarlarını tutar.
    private readonly AiProviderSettings _aiProviderSettings;

    // Gemini API'ye HTTP isteği atmak için kullanılır.
    private readonly HttpClient _httpClient;

    public AiEvaluationService(
        IOptions<AiProviderSettings> aiProviderSettings,
        HttpClient httpClient)
    {
        _aiProviderSettings = aiProviderSettings.Value;
        _httpClient = httpClient;
    }

    public async Task<AiEvaluationResultDto> EvaluateAnswerAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName,
        string? expectedAnswerGuide)
    {
        // Provider Gemini ise gerçek AI değerlendirmesine gider.
        if (_aiProviderSettings.Provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            return await EvaluateAnswerWithGeminiAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName,
                expectedAnswerGuide);
        }

        // Provider Mock ise kural tabanlı değerlendirme kullanılır.
        if (_aiProviderSettings.Provider.Equals("Mock", StringComparison.OrdinalIgnoreCase))
        {
            return await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);
        }

        // Bilinmeyen provider gelirse uygulama çökmesin diye Mock fallback kullanılır.
        return await EvaluateAnswerWithMockAsync(
            questionText,
            userAnswer,
            category,
            difficulty,
            positionName);
    }

    private async Task<AiEvaluationResultDto> EvaluateAnswerWithGeminiAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName,
        string? expectedAnswerGuide)
    {
        // API key veya model boşsa Gemini çağrısı yapılamaz.
        if (string.IsNullOrWhiteSpace(_aiProviderSettings.ApiKey) ||
            string.IsNullOrWhiteSpace(_aiProviderSettings.Model))
        {
            var fallbackResult = await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);

            fallbackResult.Feedback =
                "AI değerlendirme ayarları tamamlanmadığı için cevabın temel değerlendirme kurallarına göre yorumlandı. "
                + fallbackResult.Feedback;

            return fallbackResult;
        }

        try
        {
            // Gemini'ye gönderilecek prompt hazırlanır.
            var prompt = BuildEvaluationPrompt(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName,
                expectedAnswerGuide);

            // Gemini endpoint'i oluşturulur.
            var endpoint = string.IsNullOrWhiteSpace(_aiProviderSettings.Endpoint)
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{_aiProviderSettings.Model}:generateContent"
                : $"{_aiProviderSettings.Endpoint.TrimEnd('/')}/v1beta/models/{_aiProviderSettings.Model}:generateContent";

            // Gemini request gövdesi.
            var request = new GeminiGenerateContentRequest
            {
                Contents = new List<GeminiContent>
                {
                    new GeminiContent
                    {
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart
                            {
                                Text = prompt
                            }
                        }
                    }
                }
            };

            // API key URL'ye değil, güvenli şekilde header'a eklenir.
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = JsonContent.Create(request)
            };

            httpRequest.Headers.Add("x-goog-api-key", _aiProviderSettings.ApiKey);

            // 429 / 503 gibi geçici hatalarda direkt düşmek yerine birkaç kez tekrar dener.
            var response = await SendGeminiRequestWithRetryAsync(httpRequest);

            // Gemini hata dönerse teknik hata kullanıcıya gösterilmez.
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();

                var fallbackResult = await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);

                fallbackResult.Feedback =
                    GetUserFriendlyGeminiFallbackMessage((int)response.StatusCode)
                    + " "
                    + fallbackResult.Feedback;

                // Teknik detay sadece terminale yazılır. API key yazdırılmaz.
                Console.WriteLine($"Gemini API error: HTTP {(int)response.StatusCode} - {response.StatusCode}");
                Console.WriteLine(errorContent);

                return fallbackResult;
            }

            // Gemini response DTO'ya çevrilir.
            var geminiResponse =
                await response.Content.ReadFromJsonAsync<GeminiGenerateContentResponse>();

            var responseText = geminiResponse?
                .Candidates?
                .FirstOrDefault()?
                .Content?
                .Parts?
                .FirstOrDefault()?
                .Text;

            // Gemini boş cevap dönerse fallback çalışır.
            if (string.IsNullOrWhiteSpace(responseText))
            {
                var fallbackResult = await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);

                fallbackResult.Feedback =
                    "AI değerlendirme servisi şu anda net bir yanıt üretemediği için cevabın temel değerlendirme kurallarına göre yorumlandı. "
                    + fallbackResult.Feedback;

                return fallbackResult;
            }

            // Gemini bazen JSON'u markdown bloğu içinde döndürür; temizliyoruz.
            var cleanedJson = CleanJsonResponse(responseText);

            AiEvaluationResultDto? aiResult;

            try
            {
                aiResult = JsonSerializer.Deserialize<AiEvaluationResultDto>(
                    cleanedJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
            }
            catch (Exception jsonException)
            {
                var fallbackResult = await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);

                fallbackResult.Feedback =
                    "AI değerlendirme servisi yanıtı işlenemediği için cevabın temel değerlendirme kurallarına göre yorumlandı. "
                    + fallbackResult.Feedback;

                Console.WriteLine("Gemini JSON parse error:");
                Console.WriteLine(jsonException.Message);
                Console.WriteLine("Gemini raw response:");
                Console.WriteLine(responseText);

                return fallbackResult;
            }

            // Deserialize null dönerse fallback kullanılır.
            if (aiResult is null)
            {
                var fallbackResult = await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);

                fallbackResult.Feedback =
                    "AI değerlendirme servisi boş sonuç döndürdüğü için cevabın temel değerlendirme kurallarına göre yorumlandı. "
                    + fallbackResult.Feedback;

                return fallbackResult;
            }

            // AI 0-100 dışı puan döndürürse güvenli aralığa çekilir.
            aiResult.Score = Math.Clamp(aiResult.Score, 0, 100);

            aiResult.Feedback = string.IsNullOrWhiteSpace(aiResult.Feedback)
                ? "Cevap değerlendirildi ancak feedback üretilemedi."
                : aiResult.Feedback;

            aiResult.BetterAnswerExample = string.IsNullOrWhiteSpace(aiResult.BetterAnswerExample)
                ? GenerateMockBetterAnswerExample(category, questionText)
                : aiResult.BetterAnswerExample;

            aiResult.StrongPoints ??= new List<string>();
            aiResult.ImprovementPoints ??= new List<string>();

            return aiResult;
        }
        catch (Exception exception)
        {
            // Beklenmeyen hata olursa uygulama çökmeden fallback değerlendirme döner.
            var fallbackResult = await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);

            fallbackResult.Feedback =
                "AI değerlendirme sırasında geçici bir sorun oluştuğu için cevabın temel değerlendirme kurallarına göre yorumlandı. "
                + fallbackResult.Feedback;

            Console.WriteLine("Gemini exception:");
            Console.WriteLine(exception.Message);

            return fallbackResult;
        }
    }

    // 429 / 503 gibi geçici Gemini hatalarında kısa bekleyip tekrar dener.
    private async Task<HttpResponseMessage> SendGeminiRequestWithRetryAsync(
        HttpRequestMessage originalRequest)
    {
        const int maxAttempts = 3;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            using var request = await CloneHttpRequestMessageAsync(originalRequest);

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                return response;
            }

            var statusCode = (int)response.StatusCode;

            var shouldRetry =
                statusCode == 429 ||
                statusCode == 500 ||
                statusCode == 502 ||
                statusCode == 503 ||
                statusCode == 504;

            if (!shouldRetry || attempt == maxAttempts)
            {
                return response;
            }

            response.Dispose();

            // 1. deneme sonrası 2 sn, 2. deneme sonrası 4 sn bekler.
            var delaySeconds = Math.Pow(2, attempt);

            await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
        }

        return await _httpClient.SendAsync(originalRequest);
    }

    // HttpRequestMessage tek kullanımlıktır. Retry için her denemede kopyalamamız gerekir.
    private static async Task<HttpRequestMessage> CloneHttpRequestMessageAsync(
        HttpRequestMessage request)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri);

        foreach (var header in request.Headers)
        {
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        if (request.Content is not null)
        {
            var contentBytes = await request.Content.ReadAsByteArrayAsync();

            clone.Content = new ByteArrayContent(contentBytes);

            foreach (var header in request.Content.Headers)
            {
                clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        return clone;
    }

    private static string BuildEvaluationPrompt(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName,
        string? expectedAnswerGuide)
    {
        var safeExpectedAnswerGuide = string.IsNullOrWhiteSpace(expectedAnswerGuide)
            ? "Bu soru için özel beklenen cevap rehberi verilmedi."
            : expectedAnswerGuide;

        return $$"""
Sen deneyimli bir teknik mülakat değerlendiricisisin.

Aşağıdaki aday cevabını değerlendirirken adil, gerçekçi ve öğretici davran.

Pozisyon: {{positionName}}
Kategori: {{category}}
Zorluk: {{difficulty}}

Mülakat sorusu:
{{questionText}}

Beklenen güçlü cevap rehberi:
{{safeExpectedAnswerGuide}}

Adayın cevabı:
{{userAnswer}}

Değerlendirme kuralları:
- Cevap gerçekten soruyu karşılıyor mu, bunu öncelikli değerlendir.
- Cevap sadece uzun diye yüksek puan verme.
- Cevap sadece kod formatına benziyor diye yüksek puan verme.
- Kod sorularında algoritmanın gerçekten doğru problemi çözüp çözmediğine bak.
- SQL sorularında sorgunun istenen sonucu üretip üretmediğini değerlendir.
- Behavioral sorularda STAR tekniği, somut olay, aksiyon ve sonuç var mı kontrol et.
- Teknik sorularda tanım, doğruluk, örnek ve proje bağlantısı var mı kontrol et.
- Cevap soruyla alakasızsa 0-35 arasında puan ver.
- Cevap kısmen ilgili ama eksikse 35-65 arasında puan ver.
- Cevap genel olarak doğru ama detay eksikse 65-85 arasında puan ver.
- Cevap doğru, net, örnekli ve güçlü ise 85-100 arasında puan ver.
- Feedback Türkçe olmalı.
- Feedback çok uzun olmamalı ama adayın neyi yanlış/eksik yaptığını net söylemeli.
- BetterAnswerExample alanında adayın verebileceği daha iyi bir cevap örneği yaz.
- BetterAnswerExample sadece tavsiye değil, doğrudan örnek cevap formatında olsun.

Sadece geçerli JSON döndür.
Markdown kullanma.
```json bloğu kullanma.
Ek açıklama yazma.

JSON formatı:
{
  "score": 0,
  "feedback": "Adayın cevabına özel, kısa ve net Türkçe feedback.",
  "betterAnswerExample": "Bu soruya verilebilecek daha güçlü örnek cevap.",
  "strongPoints": ["Cevabın güçlü yönü 1", "Cevabın güçlü yönü 2"],
  "improvementPoints": ["Geliştirilmesi gereken nokta 1", "Geliştirilmesi gereken nokta 2"]
}
""";
    }

    // Gemini hata verdiğinde kullanıcıya teknik detay göstermeden temiz mesaj üretir.
    private static string GetUserFriendlyGeminiFallbackMessage(int statusCode)
    {
        return statusCode switch
        {
            429 =>
                "AI değerlendirme servisi şu anda çok yoğun olduğu için cevabın temel değerlendirme kurallarına göre yorumlandı.",

            503 =>
                "AI değerlendirme servisi şu anda geçici olarak yanıt veremediği için cevabın temel değerlendirme kurallarına göre yorumlandı.",

            500 or 502 or 504 =>
                "AI değerlendirme servisinde geçici bir bağlantı sorunu olduğu için cevabın temel değerlendirme kurallarına göre yorumlandı.",

            401 or 403 =>
                "AI değerlendirme yetkilendirmesinde sorun olduğu için cevabın temel değerlendirme kurallarına göre yorumlandı.",

            _ =>
                "AI değerlendirme servisi geçici olarak kullanılamadığı için cevabın temel değerlendirme kurallarına göre yorumlandı."
        };
    }

    // Gemini JSON cevabını ```json gibi markdown işaretlerinden temizler.
    private static string CleanJsonResponse(string responseText)
    {
        var cleaned = responseText.Trim();

        cleaned = Regex.Replace(cleaned, @"^```json\s*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"^```\s*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"\s*```$", "", RegexOptions.IgnoreCase);

        return cleaned.Trim();
    }

    // Gerçek AI kullanılamadığında devreye giren kural tabanlı değerlendirme.
    private static Task<AiEvaluationResultDto> EvaluateAnswerWithMockAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName)
    {
        if (string.IsNullOrWhiteSpace(userAnswer))
        {
            return Task.FromResult(new AiEvaluationResultDto
            {
                Score = 0,
                Feedback = "Cevap boş bırakılmış. Soruyu cevaplamak için en azından temel bir açıklama yapmalısın.",
                BetterAnswerExample = "Bu soruya daha güçlü cevap vermek için önce kavramı kısaca tanımlayabilir, ardından kendi proje veya deneyiminden bir örnek verebilirsin.",
                StrongPoints = new List<string>(),
                ImprovementPoints = new List<string>
                {
                    "Cevap boş bırakılmış.",
                    "Temel kavram açıklaması eksik.",
                    "Örnek veya proje bağlantısı yok."
                }
            });
        }

        var normalizedAnswer = userAnswer.ToLower();
        var normalizedCategory = category.ToLower();

        var score = 50;
        var strongPoints = new List<string>();
        var improvementPoints = new List<string>();

        if (userAnswer.Length >= 80)
        {
            score += 15;
            strongPoints.Add("Cevap yeterli uzunlukta ve açıklama yapmaya çalışıyor.");
        }
        else
        {
            improvementPoints.Add("Cevap biraz kısa kalmış. Daha açıklayıcı yazabilirsin.");
        }

        if (userAnswer.Length >= 180)
        {
            score += 10;
            strongPoints.Add("Cevap detaylandırılmış görünüyor.");
        }

        if (ContainsExampleExpression(normalizedAnswer))
        {
            score += 10;
            strongPoints.Add("Cevap örnek veya proje deneyimiyle desteklenmiş.");
        }
        else
        {
            improvementPoints.Add("Cevaba kısa bir örnek veya proje deneyimi ekleyebilirsin.");
        }

        if (normalizedCategory.Contains("sql"))
        {
            if (normalizedAnswer.Contains("select") && normalizedAnswer.Contains("from"))
            {
                score += 15;
                strongPoints.Add("SQL cevabında temel sorgu yapısı bulunuyor.");
            }
            else
            {
                improvementPoints.Add("SQL cevabında SELECT ve FROM gibi temel sorgu yapıları daha net olmalı.");
            }
        }
        else if (normalizedCategory.Contains("coding"))
        {
            if (normalizedAnswer.Contains("return"))
            {
                score += 15;
                strongPoints.Add("Kod cevabında dönüş değeri gösterilmiş.");
            }
            else
            {
                improvementPoints.Add("Kod cevabında return/dönüş değeri daha net gösterilmeli.");
            }
        }
        else
        {
            score += 5;
        }

        score = Math.Clamp(score, 0, 100);

        var feedback = GenerateMockFeedback(score, category, questionText);
        var betterAnswerExample = GenerateMockBetterAnswerExample(category, questionText);

        return Task.FromResult(new AiEvaluationResultDto
        {
            Score = score,
            Feedback = feedback,
            BetterAnswerExample = betterAnswerExample,
            StrongPoints = strongPoints,
            ImprovementPoints = improvementPoints
        });
    }

    private static bool ContainsExampleExpression(string normalizedAnswer)
    {
        var exampleExpressions = new List<string>
        {
            "örneğin",
            "mesela",
            "example",
            "for example",
            "projemde",
            "projede",
            "kullandım",
            "uyguladım",
            "senaryo"
        };

        return exampleExpressions.Any(expression =>
            normalizedAnswer.Contains(expression));
    }

    private static string GenerateMockFeedback(
        int score,
        string category,
        string questionText)
    {
        var normalizedCategory = category.ToLower();
        var normalizedQuestion = questionText.ToLower();

        if (normalizedCategory.Contains("coding"))
        {
            if (normalizedQuestion.Contains("max") || normalizedQuestion.Contains("en büyük"))
            {
                return score >= 70
                    ? "Kod cevabın liste/dizi üzerinde maksimum değeri bulma mantığına yaklaşmış görünüyor. Daha güçlü olması için fonksiyonun parametre olarak liste alması, başlangıç maksimum değerini belirlemesi ve tüm elemanları karşılaştırması gerekir."
                    : "Bu soruda amaç listedeki en büyük sayıyı bulmak. Cevabında fonksiyon yapısı olsa bile listeyi gezme, karşılaştırma yapma ve maksimum değeri return etme mantığını daha net göstermelisin.";
            }

            if (normalizedQuestion.Contains("reverse") || normalizedQuestion.Contains("ters"))
            {
                return score >= 70
                    ? "Kod cevabın ters çevirme problemine yaklaşmış görünüyor. Daha güçlü olması için input değeri alıp ters çevrilmiş sonucu açıkça return etmelisin."
                    : "Bu soruda amaç metni veya listeyi ters çevirmek. Cevabında fonksiyon yapısının yanında ters çevirme işlemini ve return edilen sonucu daha net göstermelisin.";
            }

            if (normalizedQuestion.Contains("palindrome"))
            {
                return score >= 70
                    ? "Kod cevabın palindrome kontrolü için temel yapıya sahip görünüyor. Daha güçlü olması için değerin ters haliyle karşılaştırılması ve true/false sonuç dönmesi net olmalı."
                    : "Bu soruda amaç palindrome kontrolü yapmak. Cevabında metni ters çevirme, orijinal değerle karşılaştırma ve boolean sonuç döndürme mantığını göstermelisin.";
            }

            if (normalizedQuestion.Contains("frekans") ||
                normalizedQuestion.Contains("tekrar") ||
                normalizedQuestion.Contains("frequency"))
            {
                return score >= 70
                    ? "Kod cevabın frekans sayma problemine yaklaşmış görünüyor. Daha güçlü olması için dictionary/map yapısıyla her elemanın kaç kez geçtiğini saymalısın."
                    : "Bu soruda amaç tekrar/frekans saymak. Cevabında dictionary, map veya benzeri bir yapı kullanarak elemanların kaç kez geçtiğini hesaplama mantığını göstermelisin.";
            }

            if (score >= 85)
            {
                return "Kod cevabın güçlü görünüyor. Fonksiyon yapısı, dönüş değeri ve çözüm adımları genel olarak iyi kurulmuş.";
            }

            if (score >= 70)
            {
                return "Kod cevabın genel olarak iyi. Daha güçlü olması için algoritma mantığını kısa bir açıklamayla destekleyebilir ve edge case durumlarını düşünebilirsin.";
            }

            if (score >= 50)
            {
                return "Cevabın temel kod yapısını içeriyor. Daha güçlü olması için çözümün sorudaki problemi gerçekten karşılayıp karşılamadığını kontrol etmeli ve algoritma mantığını daha net göstermelisin.";
            }

            return "Kod cevabın geliştirmeye açık. Önce fonksiyon/metot yapısını kurup, parametreleri ve dönüş değerini net göstermelisin.";
        }

        if (normalizedCategory.Contains("sql"))
        {
            if (normalizedQuestion.Contains("join"))
            {
                return "Bu soru JOIN mantığını ölçüyor. Cevabında tabloları hangi kolonlar üzerinden bağladığını ve neden JOIN kullandığını daha net göstermelisin.";
            }

            if (normalizedQuestion.Contains("group by") ||
                normalizedQuestion.Contains("count") ||
                normalizedQuestion.Contains("ortalama") ||
                normalizedQuestion.Contains("average"))
            {
                return "Bu soru gruplama veya aggregate fonksiyon kullanımını ölçüyor. GROUP BY ile hangi alana göre gruplama yaptığını ve COUNT/AVG gibi fonksiyonları neden kullandığını net göstermelisin.";
            }

            if (normalizedQuestion.Contains("where") || normalizedQuestion.Contains("filtre"))
            {
                return "Bu soru filtreleme mantığını ölçüyor. SELECT ve FROM yapısından sonra WHERE koşulunu soruya uygun şekilde net yazmalısın.";
            }

            if (score >= 85)
            {
                return "SQL cevabın güçlü görünüyor. Temel sorgu yapısı, filtreleme ve tablo ilişkileri iyi kurulmuş.";
            }

            if (score >= 70)
            {
                return "SQL cevabın genel olarak iyi. Daha güçlü olması için tablo/kolon adlarını netleştirip sorgunun ne yaptığını kısa bir cümleyle açıklayabilirsin.";
            }

            if (score >= 50)
            {
                return "SQL cevabın temel sorgu yapısını içeriyor. Daha güçlü olması için SELECT, FROM, WHERE, JOIN veya GROUP BY gibi gerekli yapıları soruya göre daha net kullanmalısın.";
            }

            return "SQL cevabın geliştirmeye açık. Önce temel SELECT-FROM yapısını kurup, ardından sorunun istediği filtreleme veya gruplama kısmını eklemelisin.";
        }

        if (score >= 85)
        {
            return "Cevabın güçlü görünüyor. Açıklama, yapı ve örnek kullanımı açısından iyi bir seviyede.";
        }

        if (score >= 70)
        {
            return "Cevabın genel olarak iyi. Daha güçlü olması için biraz daha teknik detay ve somut örnek ekleyebilirsin.";
        }

        if (score >= 50)
        {
            return "Cevabın temel seviyede yeterli olabilir ancak daha açıklayıcı, yapılandırılmış ve örnekli olmalı.";
        }

        return "Cevabın geliştirmeye açık. Önce kavramı net tanımlayıp ardından kısa bir örnekle desteklemelisin.";
    }

    private static string GenerateMockBetterAnswerExample(
        string category,
        string questionText)
    {
        var normalizedCategory = category.ToLower();
        var normalizedQuestion = questionText.ToLower();

        if (normalizedCategory.Contains("sql"))
        {
            if (normalizedQuestion.Contains("join"))
            {
                return "Daha güçlü bir cevapta tablolar arasındaki ilişkiyi JOIN ile açıkça kurmalısın. Örneğin: SELECT c.Name, o.OrderDate FROM Customers c INNER JOIN Orders o ON c.Id = o.CustomerId; Bu sorgudan sonra hangi tabloları neden bağladığını kısa bir cümleyle açıklaman cevabı güçlendirir.";
            }

            if (normalizedQuestion.Contains("group by") ||
                normalizedQuestion.Contains("count") ||
                normalizedQuestion.Contains("average") ||
                normalizedQuestion.Contains("ortalama"))
            {
                return "Daha güçlü bir cevapta aggregate fonksiyonları ve GROUP BY yapısını birlikte kullanmalısın. Örneğin: SELECT DepartmentId, COUNT(*) AS EmployeeCount FROM Employees GROUP BY DepartmentId; Ardından gruplamanın hangi alana göre yapıldığını açıklamalısın.";
            }

            if (normalizedQuestion.Contains("where") || normalizedQuestion.Contains("filtre"))
            {
                return "Daha güçlü bir cevapta SELECT ve FROM yapısından sonra WHERE ile filtreleme koşulunu net yazmalısın. Örneğin: SELECT * FROM Customers WHERE City = 'Konya'; Ardından bu koşulun hangi kayıtları getirdiğini açıklamalısın.";
            }

            return "Daha güçlü bir SQL cevabında önce temel sorguyu net yazmalısın: SELECT alanlar FROM tablo WHERE koşul; Sonra sorgunun hangi veriyi neden getirdiğini kısa bir cümleyle açıklamalısın.";
        }

        if (normalizedCategory.Contains("coding"))
        {
            if (normalizedQuestion.Contains("max") || normalizedQuestion.Contains("en büyük"))
            {
                return "Daha güçlü bir kod cevabında fonksiyon bir liste/dizi parametresi almalı, ilk elemanı başlangıç maksimum değeri kabul etmeli, döngüyle tüm elemanları gezmeli ve daha büyük değer bulduğunda maksimumu güncellemelidir. Sonunda bulunan maksimum değer return edilmelidir.";
            }

            if (normalizedQuestion.Contains("reverse") || normalizedQuestion.Contains("ters"))
            {
                return "Daha güçlü bir kod cevabında metin veya liste parametre olarak alınmalı, ters çevirme işlemi uygulanmalı ve sonuç return edilmelidir. Ayrıca boş string veya tek karakterli değer gibi edge case durumları düşünmek cevabı güçlendirir.";
            }

            if (normalizedQuestion.Contains("palindrome"))
            {
                return "Daha güçlü bir kod cevabında gelen metin normalize edilmeli, ters çevrilmiş haliyle karşılaştırılmalı ve sonuç true/false olarak döndürülmelidir. Büyük-küçük harf farkı ve boşluklar gibi edge case durumları da dikkate alınabilir.";
            }

            if (normalizedQuestion.Contains("frekans") ||
                normalizedQuestion.Contains("tekrar") ||
                normalizedQuestion.Contains("frequency"))
            {
                return "Daha güçlü bir kod cevabında dictionary/map yapısı kullanılabilir. Liste veya metindeki her eleman gezilir, eleman daha önce eklendiyse sayacı artırılır, yoksa başlangıç değeri 1 yapılır. Sonuç olarak frekans tablosu return edilir.";
            }

            return "Daha güçlü bir kod cevabında fonksiyon/metot adı, parametreler, algoritma adımları ve return değeri net olmalıdır. Cevabını sadece kodla bırakmak yerine, çözüm mantığını bir cümleyle açıklaman da cevabı güçlendirir.";
        }

        if (normalizedCategory.Contains("behavioral"))
        {
            return "Daha güçlü bir davranışsal cevap için STAR tekniğini kullanabilirsin: Önce durumu anlat, sonra görevini açıkla, ardından hangi aksiyonu aldığını söyle ve en sonda sonucu belirt. Örneğin bir ekip çalışması, problem çözme veya zaman yönetimi deneyimini somut bir olay üzerinden anlatman daha etkili olur.";
        }

        if (normalizedQuestion.Contains("api") || normalizedQuestion.Contains("rest"))
        {
            return "Daha güçlü bir cevapta API'nin iki sistemin birbiriyle iletişim kurmasını sağlayan yapı olduğunu söyleyebilirsin. REST API için HTTP metotlarından bahsedip GET, POST, PUT ve DELETE örnekleri verebilirsin. Son olarak kendi projende frontend ile backend arasında veri alışverişini REST endpointleriyle yaptığını anlatman cevabı güçlendirir.";
        }

        if (normalizedQuestion.Contains("jwt"))
        {
            return "Daha güçlü bir cevapta JWT'nin kullanıcı doğrulama ve yetkilendirme için kullanılan token tabanlı bir yapı olduğunu açıklayabilirsin. Login sonrası backend token üretir, frontend bu token'ı saklar ve sonraki isteklerde Authorization header içinde gönderir. Böylece kullanıcı kimliği doğrulanabilir.";
        }

        if (normalizedQuestion.Contains("controller") ||
            normalizedQuestion.Contains("service") ||
            normalizedQuestion.Contains("repository"))
        {
            return "Daha güçlü bir cevapta controller'ın HTTP isteklerini karşıladığını, service katmanının iş kurallarını yönettiğini, repository veya data access katmanının ise veritabanı işlemlerini yaptığını açıklayabilirsin. Bu ayrım kodun daha temiz, test edilebilir ve sürdürülebilir olmasını sağlar.";
        }

        return "Daha güçlü bir cevap için önce kavramı kısa ve net tanımla, ardından kendi proje veya deneyiminden somut bir örnek ver. Son olarak bu deneyimin işe, projeye veya kullanıcıya nasıl katkı sağladığını belirt.";
    }

    private class GeminiGenerateContentRequest
    {
        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();
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