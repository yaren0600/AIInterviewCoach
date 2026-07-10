using AIInterviewCoach.Application.DTOs;
using AIInterviewCoach.Application.Interfaces;

namespace AIInterviewCoach.Infrastructure.Services;

public class AiEvaluationService : IAiEvaluationService

//Bu dosya şimdilik gerçek AI değil ama AI servisinin taklit versiyonu.
//Sonra bunun içini GPT/Gemini API ile değiştireceğiz.
{
    public Task<AiEvaluationResultDto> EvaluateAnswerAsync(
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

        var feedback = GenerateMockFeedback(score, category);
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

    private static string GenerateMockFeedback(int score, string category)
    {
        var normalizedCategory = category.ToLower();

        if (normalizedCategory.Contains("coding"))
        {
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
            return "Daha güçlü bir SQL cevabında önce sorguyu yazıp ardından ne yaptığını açıklayabilirsin. Örneğin: SELECT alanlar FROM tablo WHERE koşul; şeklinde temel sorgu yapısını net gösterebilirsin.";
        }

        if (normalizedCategory.Contains("coding"))
        {
            return "Daha güçlü bir kod cevabında fonksiyon/metot tanımı, parametreler, temel algoritma adımları ve return değeri net olmalı. Ayrıca kısa bir cümleyle çözüm mantığını açıklayabilirsin.";
        }

        if (normalizedCategory.Contains("behavioral"))
        {
            return "Daha güçlü bir davranışsal cevap için STAR tekniğini kullanabilirsin: Durum, Görev, Aksiyon ve Sonuç. Cevabında somut bir olay ve bu olaydan ne öğrendiğini belirtmen iyi olur.";
        }

        if (normalizedQuestion.Contains("api") || normalizedQuestion.Contains("rest"))
        {
            return "Daha güçlü bir cevapta API kavramını kısaca tanımlayıp, frontend-backend iletişiminde nasıl kullanıldığını açıklayabilir ve kısa bir request-response örneği verebilirsin.";
        }

        return "Daha güçlü bir cevap için önce kavramı kısa ve net tanımla, ardından kendi proje veya deneyiminden somut bir örnek ver. Son olarak bu deneyimin işe veya projeye nasıl katkı sağladığını belirt.";
    }
}