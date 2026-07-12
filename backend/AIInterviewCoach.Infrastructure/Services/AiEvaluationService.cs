using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;
using AIInterviewCoach.Infrastructure.Settings;
using Microsoft.Extensions.Options;

namespace AIInterviewCoach.Infrastructure.Services;

public class AiEvaluationService : IAiEvaluationService
{
    private readonly AiProviderSettings _aiProviderSettings;
    public AiEvaluationService(IOptions<AiProviderSettings> aiProviderSettings)
    {
        _aiProviderSettings = aiProviderSettings.Value;
    }

    //Bu dosya şimdilik gerçek AI değil ama AI servisinin taklit versiyonu.
    //Sonra bunun içini GPT/Gemini API ile değiştireceğiz.

    public async Task<AiEvaluationResultDto> EvaluateAnswerAsync(
    string questionText,
    string userAnswer,
    string category,
    string difficulty,
    string positionName)
    {
        if (_aiProviderSettings.Provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            return await EvaluateAnswerWithGeminiAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);
        }

        if (_aiProviderSettings.Provider.Equals("Mock", StringComparison.OrdinalIgnoreCase))
        {
            return await EvaluateAnswerWithMockAsync(
                questionText,
                userAnswer,
                category,
                difficulty,
                positionName);
        }

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
    string positionName)
    {
        // Şimdilik gerçek Gemini API çağrısını burada yapmıyoruz.
        // Bir sonraki adımda HttpClient ile Gemini endpoint'ine istek atacağız.
        // Şu an fallback olarak mock değerlendirmeyi döndürüyoruz.

        var mockResult = await EvaluateAnswerWithMockAsync(
            questionText,
            userAnswer,
            category,
            difficulty,
            positionName);

        mockResult.Feedback =
            "[Gemini hazırlık modu] " + mockResult.Feedback;

        return mockResult;
    }

    private static Task<AiEvaluationResultDto> EvaluateAnswerWithMockAsync(
        string questionText,
        string userAnswer,
        string category,
        string difficulty,
        string positionName)
    {
        var normalizedAnswer = userAnswer.ToLower();
        var normalizedCategory = category.ToLower();

        var score = 50;
        var strongPoints = new List<string>();
        var improvementPoints = new List<string>();

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

    private static string GenerateMockFeedback(int score, string category, string questionText)
    {
        var normalizedCategory = category.ToLower();
        var normalizedQuestion = questionText.ToLower();

        if (normalizedCategory.Contains("coding"))
        {
            if (normalizedQuestion.Contains("max") || normalizedQuestion.Contains("en büyük"))
            {
                if (score >= 70)
                {
                    return "Kod cevabın liste/dizi üzerinde maksimum değeri bulma mantığına yaklaşmış görünüyor. Daha güçlü olması için fonksiyonun parametre olarak liste alması, başlangıç maksimum değerini belirlemesi ve tüm elemanları karşılaştırması gerekir.";
                }

                return "Bu soruda amaç listedeki en büyük sayıyı bulmak. Cevabında fonksiyon yapısı olsa bile listeyi gezme, karşılaştırma yapma ve maksimum değeri return etme mantığını daha net göstermelisin.";
            }

            if (normalizedQuestion.Contains("reverse") || normalizedQuestion.Contains("ters"))
            {
                if (score >= 70)
                {
                    return "Kod cevabın ters çevirme problemine yaklaşmış görünüyor. Daha güçlü olması için input değeri alıp ters çevrilmiş sonucu açıkça return etmelisin.";
                }

                return "Bu soruda amaç metni veya listeyi ters çevirmek. Cevabında fonksiyon yapısının yanında ters çevirme işlemini ve return edilen sonucu daha net göstermelisin.";
            }

            if (normalizedQuestion.Contains("palindrome"))
            {
                if (score >= 70)
                {
                    return "Kod cevabın palindrome kontrolü için temel yapıya sahip görünüyor. Daha güçlü olması için değerin ters haliyle karşılaştırılması ve true/false sonuç dönmesi net olmalı.";
                }

                return "Bu soruda amaç palindrome kontrolü yapmak. Cevabında metni ters çevirme, orijinal değerle karşılaştırma ve boolean sonuç döndürme mantığını göstermelisin.";
            }

            if (normalizedQuestion.Contains("frekans") ||
                normalizedQuestion.Contains("tekrar") ||
                normalizedQuestion.Contains("frequency"))
            {
                if (score >= 70)
                {
                    return "Kod cevabın frekans sayma problemine yaklaşmış görünüyor. Daha güçlü olması için dictionary/map yapısıyla her elemanın kaç kez geçtiğini saymalısın.";
                }

                return "Bu soruda amaç tekrar/frekans saymak. Cevabında dictionary, map veya benzeri bir yapı kullanarak elemanların kaç kez geçtiğini hesaplama mantığını göstermelisin.";
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

    private static string GenerateMockBetterAnswerExample(string category, string questionText)
    {
        var normalizedCategory = category.ToLower();
        var normalizedQuestion = questionText.ToLower();

        if (normalizedCategory.Contains("sql"))
        {
            if (normalizedQuestion.Contains("join"))
            {
                return "Daha güçlü bir cevapta tablolar arasındaki ilişkiyi JOIN ile açıkça kurmalısın. Örneğin: SELECT c.Name, o.OrderDate FROM Customers c INNER JOIN Orders o ON c.Id = o.CustomerId; Bu sorgudan sonra hangi tabloları neden bağladığını kısa bir cümleyle açıklaman cevabı güçlendirir.";
            }

            if (normalizedQuestion.Contains("group by") || normalizedQuestion.Contains("count") || normalizedQuestion.Contains("average") || normalizedQuestion.Contains("ortalama"))
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

            if (normalizedQuestion.Contains("frekans") || normalizedQuestion.Contains("tekrar") || normalizedQuestion.Contains("frequency"))
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
}