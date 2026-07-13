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
        var roleBasedQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = $"{positionName} pozisyonunda çalışırken karşılaşabileceğin temel sorumlulukları nasıl yönetirsin? Örnek bir senaryo ile açıklar mısın?",
            Category = "Rol Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap pozisyonun temel sorumluluklarını, adayın yaklaşımını ve somut bir örnek senaryoyu içermelidir."
        },
        new()
        {
            QuestionText = $"{positionName} rolünde bir iş biriminden eksik veya belirsiz bir talep geldiğinde nasıl ilerlersin?",
            Category = "Rol Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap gereksinim analizi, doğru soruları sorma, dokümantasyon ve teknik ekiple iletişim adımlarını içermelidir."
        },
        new()
        {
            QuestionText = $"{positionName} pozisyonunda öncelikleri çakışan iki görev aldığında nasıl karar verirsin?",
            Category = "Rol Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap önceliklendirme, etki analizi, zaman yönetimi ve paydaş iletişimini açıklamalıdır."
        },
        new()
        {
            QuestionText = $"{positionName} olarak teknik ekip ile iş birimi arasında iletişim kurman gerekirse nasıl bir köprü rolü üstlenirsin?",
            Category = "Rol Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap teknik olmayan dili teknik gereksinime dönüştürme ve anlaşılır iletişim kurma becerisini göstermelidir."
        },
        new()
        {
            QuestionText = $"{positionName} rolünde başarıyı ölçmek için hangi kriterlere bakarsın?",
            Category = "Rol Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap çıktı kalitesi, kullanıcı memnuniyeti, zamanında teslim, hata oranı ve iş hedefleriyle uyumu içermelidir."
        }
    };

        var behavioralQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = $"{positionName} rolüyle ilgili zor bir problemi çözdüğün bir zamanı anlatır mısın?",
            Category = "Davranışsal",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap STAR tekniğini kullanmalıdır: Situation, Task, Action ve Result. Yani durum, görev, aksiyon ve sonuç net anlatılmalıdır."
        },
        new()
        {
            QuestionText = "Bir ekip çalışmasında fikir ayrılığı yaşadığın bir durumu ve bunu nasıl çözdüğünü anlatır mısın?",
            Category = "Davranışsal",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap iletişim, empati, çözüm odaklılık ve sonuç kısmını net şekilde göstermelidir."
        },
        new()
        {
            QuestionText = "Bilmediğin bir teknolojiyle çalışman gerektiğinde nasıl bir öğrenme süreci izlersin?",
            Category = "Davranışsal",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap araştırma, küçük denemeler yapma, dokümantasyon okuma ve gerektiğinde destek alma adımlarını içermelidir."
        },
        new()
        {
            QuestionText = "Zamanın kısıtlı olduğu bir görevde nasıl planlama yaparsın?",
            Category = "Davranışsal",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap önceliklendirme, işi parçalara bölme, riskleri belirleme ve iletişim kurma adımlarını içermelidir."
        },
        new()
        {
            QuestionText = "Daha önce hata yaptığın bir durumu ve bu hatadan ne öğrendiğini anlatır mısın?",
            Category = "Davranışsal",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap hatayı sahiplenme, çözüm üretme ve öğrenilen dersi somutlaştırma içermelidir."
        }
    };

        var technicalQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = $"{positionName} rolünde kullanılan önemli bir teknik kavramı açıklar mısın? Gerçek bir proje örneğiyle destekle.",
            Category = "Teknik",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap net bir tanım, kullanım amacı ve proje üzerinden somut bir örnek içermelidir."
        },
        new()
        {
            QuestionText = "REST API nedir? Bir backend projesinde neden kullanılır?",
            Category = "Teknik",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap HTTP metodları, endpoint mantığı, request-response yapısı ve örnek kullanım içermelidir."
        },
        new()
        {
            QuestionText = "Veritabanında JOIN nedir? INNER JOIN ve LEFT JOIN arasındaki farkı açıklayabilir misin?",
            Category = "Teknik",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap iki tabloyu ilişkilendirme mantığını ve join türlerinin farkını örnekle açıklamalıdır."
        },
        new()
        {
            QuestionText = "Katmanlı mimari nedir? Controller, Service ve Repository katmanları ne işe yarar?",
            Category = "Teknik",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap sorumluluk ayrımı, bakım kolaylığı ve test edilebilirlik avantajlarını açıklamalıdır."
        },
        new()
        {
            QuestionText = "JWT nedir ve kullanıcı kimlik doğrulama sürecinde nasıl kullanılır?",
            Category = "Teknik",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap token üretimi, Authorization header, kullanıcı doğrulama ve güvenlik mantığını içermelidir."
        }
    };

        var sqlQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = "Bir müşterinin 3’ten fazla siparişi varsa, müşteri adını ve toplam sipariş sayısını listeleyen SQL sorgusunu yaz.",
            Category = "SQL Pratiği",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap GROUP BY, COUNT ve HAVING ifadelerini doğru şekilde kullanmalıdır."
        },
        new()
        {
            QuestionText = "Products tablosunda fiyatı 1000’den büyük olan ürünleri en pahalıdan en ucuza listeleyen SQL sorgusunu yaz.",
            Category = "SQL Pratiği",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap WHERE ve ORDER BY ifadelerini doğru kullanmalıdır."
        },
        new()
        {
            QuestionText = "Employees ve Departments tablolarını kullanarak her çalışanın adını ve departman adını listeleyen SQL sorgusunu yaz.",
            Category = "SQL Pratiği",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap JOIN kullanımını doğru göstermelidir."
        },
        new()
        {
            QuestionText = "Orders tablosunda her müşterinin toplam sipariş tutarını hesaplayan SQL sorgusunu yaz.",
            Category = "SQL Pratiği",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap SUM ve GROUP BY kullanımını içermelidir."
        },
        new()
        {
            QuestionText = "Users tablosunda email alanı boş olmayan ve aktif kullanıcıları listeleyen SQL sorgusunu yaz.",
            Category = "SQL Pratiği",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap WHERE, IS NOT NULL ve aktiflik filtresini doğru kullanmalıdır."
        }
    };

        var codingQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = $"{programmingLanguage} kullanarak bir integer dizisindeki en büyük ikinci sayıyı bulan bir fonksiyon yaz.",
            Category = $"Kodlama Pratiği - {programmingLanguage}",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap edge case durumlarını ele almalı, mümkünse gereksiz sıralamadan kaçınmalı ve zaman karmaşıklığını açıklamalıdır."
        },
        new()
        {
            QuestionText = $"{programmingLanguage} kullanarak verilen bir metnin palindrome olup olmadığını kontrol eden bir fonksiyon yaz.",
            Category = $"Kodlama Pratiği - {programmingLanguage}",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap büyük/küçük harf duyarlılığını, boşlukları ve temel string işlemlerini doğru ele almalıdır."
        },
        new()
        {
            QuestionText = $"{programmingLanguage} kullanarak bir dizide tekrar eden elemanları bulan bir fonksiyon yaz.",
            Category = $"Kodlama Pratiği - {programmingLanguage}",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap HashSet veya benzeri veri yapılarıyla verimli çözüm sunmalıdır."
        },
        new()
        {
            QuestionText = $"{programmingLanguage} kullanarak verilen bir sayı listesinin ortalamasını hesaplayan bir fonksiyon yaz.",
            Category = $"Kodlama Pratiği - {programmingLanguage}",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap boş liste kontrolü, toplam alma ve doğru veri tipi kullanımını içermelidir."
        },
        new()
        {
            QuestionText = $"{programmingLanguage} kullanarak iki string’in anagram olup olmadığını kontrol eden bir fonksiyon yaz.",
            Category = $"Kodlama Pratiği - {programmingLanguage}",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap karakter sayma, sıralama veya dictionary/hash map mantığını doğru kullanmalıdır."
        }
    };

        var cvBasedQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = string.IsNullOrWhiteSpace(resumeContent)
                ? $"Geçmiş deneyimlerine göre seni {positionName} rolü için uygun yapan en güçlü becerin nedir?"
                : $"CV’ne göre seni {positionName} rolü için uygun yapan bir proje veya becerini anlatır mısın?",
            Category = "CV Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap adayın CV deneyimini hedef pozisyonla ilişkilendirmelidir."
        },
        new()
        {
            QuestionText = $"CV’ndeki teknik becerilerden hangisinin {positionName} pozisyonunda en çok işe yarayacağını düşünüyorsun?",
            Category = "CV Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap beceriyi pozisyonun ihtiyacıyla ilişkilendirmeli ve örnekle desteklemelidir."
        },
        new()
        {
            QuestionText = "CV’ndeki bir projede karşılaştığın teknik bir zorluğu ve nasıl çözdüğünü anlatır mısın?",
            Category = "CV Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap problem, kullanılan teknoloji, çözüm yaklaşımı ve sonuç kısmını içermelidir."
        },
        new()
        {
            QuestionText = $"CV’ndeki deneyimlerine göre {positionName} rolünde ilk 3 ayda nasıl katkı sağlayabilirsin?",
            Category = "CV Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap gerçekçi katkı alanları, öğrenme isteği ve pozisyona uyumu göstermelidir."
        },
        new()
        {
            QuestionText = "CV’ndeki hangi deneyimi mülakatta özellikle vurgulamak istersin ve neden?",
            Category = "CV Odaklı",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap adayın en güçlü deneyimini seçip pozisyona uygun şekilde anlatmasını içermelidir."
        }
    };

        var mixedQuestions = new List<AiGeneratedQuestionDto>
    {
        new()
        {
            QuestionText = $"Seni {positionName} pozisyonu için güçlü bir aday yapan özellik nedir? Somut bir örnekle açıklar mısın?",
            Category = "Karma",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap teknik becerileri, iletişim yönünü ve somut bir proje ya da deneyim örneğini birlikte içermelidir."
        },
        new()
        {
            QuestionText = "Bir projede hem teknik hem iletişim becerilerini kullanman gereken bir durumu anlatır mısın?",
            Category = "Karma",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap teknik çözüm ile ekip/paydaş iletişimini birlikte açıklamalıdır."
        },
        new()
        {
            QuestionText = $"{positionName} rolünde başarılı olmak için hangi teknik ve kişisel becerilerin önemli olduğunu düşünüyorsun?",
            Category = "Karma",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap hem teknik yeterlilikleri hem de iletişim, öğrenme ve problem çözme becerilerini içermelidir."
        },
        new()
        {
            QuestionText = "Yeni başladığın bir projede ilk olarak hangi adımları izlersin?",
            Category = "Karma",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap analiz, dokümantasyon, teknik inceleme, planlama ve iletişim adımlarını içermelidir."
        },
        new()
        {
            QuestionText = "Bir mülakatta kendini teknik olarak güçlü göstermek için hangi projen üzerinden örnek verirdin?",
            Category = "Karma",
            Difficulty = difficulty,
            ExpectedAnswerGuide = "Güçlü bir cevap proje amacı, kullanılan teknolojiler, adayın katkısı ve sonuçları açıklamalıdır."
        }
    };

        var selectedQuestions = normalizedMode switch
        {
            "role-based" => roleBasedQuestions,
            "behavioral" => behavioralQuestions,
            "technical" => technicalQuestions,
            "sql-practice" => sqlQuestions,
            "coding-practice" => codingQuestions,
            "cv-based" => cvBasedQuestions,
            _ => mixedQuestions
        };

        var selectedIndex = (index - 1) % selectedQuestions.Count;

        return selectedQuestions[selectedIndex];
    }
    private static string NormalizeInterviewMode(string? interviewMode)
    {
        var normalizedMode = interviewMode?.Trim().ToLower();

        return normalizedMode switch
        {
            "role-based" => "role-based",
            "role based" => "role-based",
            "rolebased" => "role-based",

            "cv-based" => "cv-based",
            "cv based" => "cv-based",
            "cvbased" => "cv-based",

            "technical" => "technical",
            "teknik" => "technical",

            "behavioral" => "behavioral",
            "davranışsal" => "behavioral",
            "davranissal" => "behavioral",

            "mixed" => "mixed",
            "karma" => "mixed",

            "sql practice" => "sql-practice",
            "sql-practice" => "sql-practice",
            "sql" => "sql-practice",
            "sql pratiği" => "sql-practice",
            "sql pratigi" => "sql-practice",

            "coding practice" => "coding-practice",
            "coding-practice" => "coding-practice",
            "coding" => "coding-practice",
            "kodlama pratiği" => "coding-practice",
            "kodlama pratigi" => "coding-practice",

            _ => "mixed"
        };
    }
}