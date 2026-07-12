using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AIInterviewCoach.Infrastructure.Services;

public class AiEvaluationService : IAiEvaluationService
{
    // appsettings.Development.json içindeki AiProvider ayarlarını tutar.
    // Örneğin: Provider = Mock / Gemini, ApiKey, Model, Endpoint.
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
        string positionName)
    {
        // appsettings içinde Provider = Gemini ise gerçek Gemini metoduna gider.
        if (_aiProviderSettings.Provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            return await EvaluateAnswerWithGeminiAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);
        }

        // Provider = Mock ise kendi kural tabanlı değerlendirmemizi kullanır.
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
    /// API key/model eksikse veya hata olursa Mock değerlendirmeye düşer.
    /// </summary>
    private async Task<AiEvaluationResultDto> EvaluateAnswerWithGeminiAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName)
    {
        // API key veya model boşsa Gemini çağrısı yapamayız.
        // Bu durumda uygulama patlamasın diye Mock değerlendirmeye döneriz.
        if (string.IsNullOrWhiteSpace(_aiProviderSettings.ApiKey) ||
            string.IsNullOrWhiteSpace(_aiProviderSettings.Model))
        {
            return await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);
        }

        try
        {
            // Gemini'ye göndereceğimiz değerlendirme prompt'u.
            var prompt = BuildEvaluationPrompt(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);

            // Endpoint boş bırakılırsa varsayılan Google Gemini endpoint'i kullanılır.
            var endpoint = string.IsNullOrWhiteSpace(_aiProviderSettings.Endpoint)
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{_aiProviderSettings.Model}:generateContent?key={_aiProviderSettings.ApiKey}"
                : $"{_aiProviderSettings.Endpoint.TrimEnd('/')}/v1beta/models/{_aiProviderSettings.Model}:generateContent?key={_aiProviderSettings.ApiKey}";

            // Gemini generateContent endpoint'inin beklediği request gövdesi.
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

            // Gemini API'ye POST isteği atıyoruz.
            var response = await _httpClient.PostAsJsonAsync(endpoint, request);

            // API başarısız dönerse uygulama çökmesin diye Mock fallback.
            if (!response.IsSuccessStatusCode)
            {
                return await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);
            }

            // Gemini response'unu kendi küçük response DTO'muza çeviriyoruz.
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

            // Boş cevap gelirse Mock fallback.
            if (string.IsNullOrWhiteSpace(responseText))
            {
                return await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);
            }

            // Gemini bazen ```json bloğu içinde cevap döndürebilir.
            // Bu yüzden JSON'u temizliyoruz.
            var cleanedJson = CleanJsonResponse(responseText);

            // Temizlenen JSON'u AiEvaluationResultDto modeline çeviriyoruz.
            var aiResult = JsonSerializer.Deserialize<AiEvaluationResultDto>(
                cleanedJson,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            // Deserialize başarısız olursa Mock fallback.
            if (aiResult is null)
            {
                return await EvaluateAnswerWithMockAsync(
                    questionText,
                    userAnswer,
                    category,
                    difficulty,
                    positionName);
            }

            // AI yanlışlıkla 0-100 dışı puan döndürürse güvenli aralığa çekiyoruz.
            aiResult.Score = Math.Clamp(aiResult.Score, 0, 100);

            // AI feedback boş döndürürse default feedback veriyoruz.
            aiResult.Feedback = string.IsNullOrWhiteSpace(aiResult.Feedback)
                ? "Cevap değerlendirildi ancak feedback üretilemedi."
                : aiResult.Feedback;

            // AI better answer boş döndürürse eski mock better answer üretilir.
            aiResult.BetterAnswerExample = string.IsNullOrWhiteSpace(aiResult.BetterAnswerExample)
                ? GenerateMockBetterAnswerExample(category, questionText)
                : aiResult.BetterAnswerExample;

            aiResult.StrongPoints ??= new List<string>();
            aiResult.ImprovementPoints ??= new List<string>();

            return aiResult;
        }
        catch
        {
            // Herhangi bir hata olursa sistem çalışmaya devam etsin diye Mock fallback.
            return await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);
        }
    }

    /// <summary>
    /// Gemini'ye gönderilecek prompt'u oluşturur.
    /// Burada AI'ya nasıl değerlendirme yapması gerektiğini anlatıyoruz.
    /// </summary>
    private static string BuildEvaluationPrompt(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName)
    {
        return $$"""
Sen bir teknik mülakat değerlendirme asistanısın.

Aşağıdaki aday cevabını değerlendir.

Pozisyon: {{positionName}}
Kategori: {{category}}
Zorluk: {{difficulty}}

Soru:
{{questionText}}

Adayın cevabı:
{{userAnswer}}

Kurallar:
- Cevabın gerçekten soruyu karşılayıp karşılamadığını değerlendir.
- Kod sorularında sadece kod yapısına değil, algoritmanın doğru problemi çözüp çözmediğine bak.
- SQL sorularında sadece SELECT/FROM var mı diye değil, sorgunun istenen sonucu üretip üretmediğine bak.
- Behavioral sorularda STAR tekniğine, somut örnek kullanımına ve sonucun anlatılmasına bak.
- Teknik sorularda tanım, örnek, proje bağlantısı ve doğruluk kriterlerini değerlendir.
- Puanı 0 ile 100 arasında ver.
- Cevap soruyla alakasızsa düşük puan ver.
- Cevap kod gibi görünse bile sorunun istediği algoritmayı çözmüyorsa yüksek puan verme.

Sadece geçerli JSON döndür. Markdown, açıklama veya ```json bloğu kullanma.

JSON formatı:
{
  "score": 0,
  "feedback": "Kısa ama açıklayıcı Türkçe feedback.",
  "betterAnswerExample": "Bu soruya verilebilecek daha güçlü örnek cevap.",
  "strongPoints": ["Güçlü nokta 1"],
  "improvementPoints": ["Gelişim noktası 1"]
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
    /// </summary>
    private class GeminiGenerateContentRequest
    {
        public List<GeminiContent> Contents { get; set; } = new();
    }

    /// <summary>
    /// Gemini content modelidir.
    /// </summary>
    private class GeminiContent
    {
        public List<GeminiPart> Parts { get; set; } = new();
    }

    /// <summary>
    /// Gemini prompt metnini taşıyan parçadır.
    /// </summary>
    private class GeminiPart
    {
        public string Text { get; set; } = string.Empty;
    }

    /// <summary>
    /// Gemini API'den dönen response modelidir.
    /// </summary>
    private class GeminiGenerateContentResponse
    {
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    /// <summary>
    /// Gemini'nin ürettiği aday cevabı temsil eder.
    /// </summary>
    private class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }
}