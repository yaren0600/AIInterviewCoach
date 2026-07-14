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
    // Örnek:
    // Provider = Mock / Gemini
    // ApiKey = Gemini API key
    // Model = gemini-2.5-flash
    // Endpoint = https://generativelanguage.googleapis.com
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

    /// <summary>
    /// Dışarıdan çağrılan ana değerlendirme metodudur.
    /// Provider ayarına göre Mock veya Gemini değerlendirmesine yönlendirir.
    /// </summary>
    public async Task<AiEvaluationResultDto> EvaluateAnswerAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName,
        string? expectedAnswerGuide)
    {
        // Provider Gemini ise gerçek Gemini API değerlendirmesine gider.
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

    /// <summary>
    /// Gemini API ile gerçek AI değerlendirmesi yapar.
    /// API key/model eksikse, API hata verirse veya JSON parse edilemezse Mock fallback'e düşer.
    /// </summary>
    private async Task<AiEvaluationResultDto> EvaluateAnswerWithGeminiAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName,
        string? expectedAnswerGuide)
    {
        // API key veya model boşsa Gemini çağrısı yapamayız.
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
                "[Gemini fallback: ApiKey veya Model boş] " + fallbackResult.Feedback;

            return fallbackResult;
        }

        try
        {
            // Gemini'ye göndereceğimiz prompt'u hazırlıyoruz.
            var prompt = BuildEvaluationPrompt(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName,
                expectedAnswerGuide);

            // Endpoint oluşturuyoruz.
            // Dikkat: API key artık URL'ye ?key= şeklinde eklenmiyor.
            // AQ... ile başlayan yeni key formatı için header kullanıyoruz.
            var endpoint = string.IsNullOrWhiteSpace(_aiProviderSettings.Endpoint)
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{_aiProviderSettings.Model}:generateContent"
                : $"{_aiProviderSettings.Endpoint.TrimEnd('/')}/v1beta/models/{_aiProviderSettings.Model}:generateContent";

            // Gemini API'nin beklediği request gövdesi.
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

            // Header'lı HTTP isteği oluşturuyoruz.
            // API key burada x-goog-api-key header'ı ile gönderiliyor.
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = JsonContent.Create(request)
            };

            httpRequest.Headers.Add("x-goog-api-key", _aiProviderSettings.ApiKey);

            // Gemini API'ye isteği gönderiyoruz.
            // Burada yalnızca bir tane response değişkeni var.
            var response = await _httpClient.SendAsync(httpRequest);

            // API başarısız dönerse status code'u feedback içinde geçici olarak gösteriyoruz.
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
                    $"[Gemini fallback: HTTP {(int)response.StatusCode} - {response.StatusCode}] "
                    + fallbackResult.Feedback;

                // Terminalde detay görmek için.
                // API key'i kesinlikle yazdırmıyoruz.
                Console.WriteLine("Gemini API error:");
                Console.WriteLine(errorContent);

                return fallbackResult;
            }

            // Gemini response'unu kendi response DTO'muza çeviriyoruz.
            var geminiResponse =
                await response.Content.ReadFromJsonAsync<GeminiGenerateContentResponse>();

            // Gemini'nin ürettiği metni response içinden alıyoruz.
            var responseText = geminiResponse?
                .Candidates?
                .FirstOrDefault()?
                .Content?
                .Parts?
                .FirstOrDefault()?
                .Text;

            // Eğer Gemini boş cevap dönerse Mock fallback kullanıyoruz.
            if (string.IsNullOrWhiteSpace(responseText))
            {
                var fallbackResult = await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);

                fallbackResult.Feedback =
                    "[Gemini fallback: Response text boş] " + fallbackResult.Feedback;

                return fallbackResult;
            }

            // Gemini bazen JSON'u ```json bloğu içinde döndürebilir.
            // Bu yüzden cevabı temizliyoruz.
            var cleanedJson = CleanJsonResponse(responseText);

            AiEvaluationResultDto? aiResult;

            try
            {
                // Temizlenen JSON'u AiEvaluationResultDto modeline çeviriyoruz.
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
                    "[Gemini fallback: JSON parse edilemedi] " + fallbackResult.Feedback;

                Console.WriteLine("Gemini JSON parse error:");
                Console.WriteLine(jsonException.Message);
                Console.WriteLine("Gemini raw response:");
                Console.WriteLine(responseText);

                return fallbackResult;
            }

            // Deserialize null dönerse Mock fallback kullanıyoruz.
            if (aiResult is null)
            {
                var fallbackResult = await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);

                fallbackResult.Feedback =
                    "[Gemini fallback: aiResult null] " + fallbackResult.Feedback;

                return fallbackResult;
            }

            // AI 0-100 dışı puan döndürürse güvenli aralığa çekiyoruz.
            aiResult.Score = Math.Clamp(aiResult.Score, 0, 100);

            // Feedback boşsa default mesaj veriyoruz.
            aiResult.Feedback = string.IsNullOrWhiteSpace(aiResult.Feedback)
                ? "Cevap değerlendirildi ancak feedback üretilemedi."
                : aiResult.Feedback;

            // Better answer boşsa mock fallback örneği kullanıyoruz.
            aiResult.BetterAnswerExample = string.IsNullOrWhiteSpace(aiResult.BetterAnswerExample)
                ? GenerateMockBetterAnswerExample(category, questionText)
                : aiResult.BetterAnswerExample;

            aiResult.StrongPoints ??= new List<string>();
            aiResult.ImprovementPoints ??= new List<string>();

            return aiResult;
        }
        catch (Exception exception)
        {
            // Beklenmeyen hata olursa uygulama çökmesin diye Mock fallback kullanıyoruz.
            var fallbackResult = await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);

            fallbackResult.Feedback =
                "[Gemini fallback: Exception oluştu] " + fallbackResult.Feedback;

            Console.WriteLine("Gemini exception:");
            Console.WriteLine(exception.Message);

            return fallbackResult;
        }
    }

    /// <summary>
    /// Gemini'ye gönderilecek prompt'u oluşturur.
    /// Burada AI'ya nasıl değerlendirme yapması gerektiğini detaylı şekilde anlatıyoruz.
    /// </summary>
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

    /// <summary>
    /// Gemini JSON cevabını ```json gibi markdown işaretlerinden temizler.
    /// </summary>
    private static string CleanJsonResponse(string responseText)
    {
        var cleaned = responseText.Trim();

        cleaned = Regex.Replace(cleaned, @"^```json\s*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"^```\s*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"\s*```$", "", RegexOptions.IgnoreCase);

        return cleaned.Trim();
    }

    /// <summary>
    /// Gerçek AI kullanılmadığında devreye giren kural tabanlı değerlendirme metodudur.
    /// Bu bizim fallback sistemimizdir.
    /// </summary>
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

    /// <summary>
    /// Cevapta örnek/proje deneyimi anlatılmış mı diye basit kelime kontrolü yapar.
    /// </summary>
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

    /// <summary>
    /// Mock feedback üretir.
    /// Kategoriye ve soru metnine göre daha özel mesajlar vermeye çalışır.
    /// </summary>
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

    /// <summary>
    /// Mock better answer example üretir.
    /// Gerçek Gemini cevabı gelmezse fallback olarak kullanılır.
    /// </summary>
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

    /// <summary>
    /// Gemini API'ye gönderilen request modelidir.
    /// JsonPropertyName kullanıyoruz çünkü Gemini REST API
    /// contents / parts / text gibi camelCase alan adları bekler.
    /// </summary>
    private class GeminiGenerateContentRequest
    {
        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();
    }

    /// <summary>
    /// Gemini content modelidir.
    /// </summary>
    private class GeminiContent
    {
        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();
    }

    /// <summary>
    /// Gemini prompt metnini taşıyan parçadır.
    /// </summary>
    private class GeminiPart
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    /// <summary>
    /// Gemini API'den dönen response modelidir.
    /// </summary>
    private class GeminiGenerateContentResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    /// <summary>
    /// Gemini'nin ürettiği aday cevabı temsil eder.
    /// </summary>
    private class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
}