"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    InterviewQuestion,
    InterviewSessionDetail,
    RawInterviewSessionDetail,
    SubmitAnswerResponse,
} from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

function normalizeInterviewSession(
    rawSession: RawInterviewSessionDetail,
    fallbackSessionId: string
): InterviewSessionDetail {
    const normalizedSessionId =
        rawSession.sessionId ??
        rawSession.id ??
        rawSession.interviewSessionId ??
        rawSession.interviewId ??
        Number(fallbackSessionId);

    const normalizedQuestions: InterviewQuestion[] = (rawSession.questions ?? [])
        .map((question, index) => {
            return {
                id: question.id ?? question.questionId ?? 0,
                text:
                    question.text ??
                    question.questionText ??
                    question.title ??
                    "Soru metni yüklenemedi.",
                category: question.category ?? question.questionCategory ?? "Genel",
                orderNo:
                    question.orderNo ?? question.orderNumber ?? question.order ?? index + 1,
            };
        })
        .filter((question) => question.id !== 0);

    return {
        sessionId: normalizedSessionId,
        positionName: rawSession.positionName ?? "Mülakat Oturumu",
        resumeFileName: rawSession.resumeFileName ?? null,
        questions: normalizedQuestions,
    };
}

export default function InterviewSessionPage() {
    const router = useRouter();
    const params = useParams();

    const sessionId = params.sessionId as string;

    const [session, setSession] = useState<InterviewSessionDetail | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answerText, setAnswerText] = useState("");
    const [lastFeedback, setLastFeedback] =
        useState<SubmitAnswerResponse | null>(null);

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadInterviewSession() {
            try {
                const storedInterviewSession = sessionStorage.getItem(
                    `interviewSession-${sessionId}`
                );

                if (!storedInterviewSession) {
                    setMessage(
                        "Mülakat oturumu bulunamadı. Lütfen yeni bir mülakat başlat."
                    );
                    return;
                }

                const parsedInterviewSession = JSON.parse(
                    storedInterviewSession
                ) as RawInterviewSessionDetail;

                const normalizedInterviewSession = normalizeInterviewSession(
                    parsedInterviewSession,
                    sessionId
                );

                if (normalizedInterviewSession.questions.length === 0) {
                    setMessage("Bu mülakat oturumu için soru bulunamadı.");
                    return;
                }

                setSession(normalizedInterviewSession);
            } catch {
                setMessage("Mülakat oturumu yüklenirken bir hata oluştu.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadInterviewSession();
    }, [router, sessionId]);

    const handleSubmitAnswer = async () => {
        if (!session) {
            return;
        }

        const currentQuestion = session.questions[currentQuestionIndex];

        if (!answerText.trim()) {
            setMessage("Lütfen önce cevabını yaz.");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await api.post("/Interviews/answer", {
                questionId: currentQuestion.id,
                userAnswer: answerText,
            });

            if (response.data.success) {
                setLastFeedback(response.data.data as SubmitAnswerResponse);
                setAnswerText("");
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Cevabın gönderilirken bir hata oluştu."
                );
            } else {
                setMessage("Cevabın gönderilirken bir hata oluştu.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (!session) {
            return;
        }

        const isLastQuestion = currentQuestionIndex === session.questions.length - 1;

        if (isLastQuestion) {
            router.push(`/interviews/${sessionId}/result`);
            return;
        }

        setCurrentQuestionIndex((currentIndex) => currentIndex + 1);
        setLastFeedback(null);
        setAnswerText("");
        setMessage("");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        Mülakat oturumu yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Soruların hazırlanıyor.
                    </p>
                </div>
            </main>
        );
    }

    if (message && !session) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                        Mülakat yüklenemedi
                    </h2>

                    <p className="mt-3 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/interviews/start")}
                        className="mt-6 rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        Mülakat başlatma ekranına dön
                    </button>
                </div>
            </main>
        );
    }

    const currentQuestion = session?.questions[currentQuestionIndex];

    const isSqlPractice =
        currentQuestion?.category?.toLowerCase().includes("sql") ?? false;

    const isCodingPractice =
        currentQuestion?.category?.toLowerCase().includes("coding practice") ||
        currentQuestion?.category?.toLowerCase().includes("kodlama") ||
        false;

    const isCodePractice = isSqlPractice || isCodingPractice;

    const progressPercentage = session
        ? Math.round(((currentQuestionIndex + 1) / session.questions.length) * 100)
        : 0;

    return (
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 py-8 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-slate-100 md:px-6">
            <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute right-10 top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute bottom-10 left-1/4 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 md:p-8">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Canlı Mülakat Oturumu
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                Her soruyu
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    AI koç desteğiyle
                                </span>{" "}
                                cevapla
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Cevabını yaz, gönder ve yapay zekadan skor, geri bildirim ve
                                gelişim önerisi al. Her sorudan sonra bir sonraki adıma geçebilirsin.
                            </p>
                        </div>

                        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                Oturum Özeti
                            </p>

                            <p className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
                                {session?.positionName}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {session?.resumeFileName
                                    ? `CV: ${session.resumeFileName}`
                                    : "CV olmadan standart mülakat"}
                            </p>

                            <div className="mt-5">
                                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <span>
                                        Soru {currentQuestionIndex + 1} /{" "}
                                        {session?.questions.length}
                                    </span>
                                    <span>{progressPercentage}%</span>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="mt-5 rounded-3xl border border-white/70 bg-white/70 px-4 py-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={() => router.push("/resumes")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            CV’lerim
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Yeni Mülakat
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </nav>

                <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Soru
                        </p>

                        <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">
                            {currentQuestion?.text ?? "Soru metni yüklenemedi."}
                        </h2>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                {currentQuestion?.category}
                            </span>

                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                Sıra {currentQuestion?.orderNo}
                            </span>
                        </div>

                        {isCodePractice && (
                            <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-400/20 dark:bg-sky-400/10">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700 dark:text-sky-200">
                                    {isSqlPractice ? "SQL Cevap Modu" : "Kodlama Cevap Modu"}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-sky-900 dark:text-sky-100">
                                    {isSqlPractice
                                        ? "Bu soruda cevabını mümkünse SQL sorgusu yazarak ver. Önce sorguyu yaz, ardından kısa bir cümleyle ne yaptığını açıkla."
                                        : "Bu soruda cevabını kod yazarak ver. Fonksiyon/metot adını, parametreleri, temel algoritma mantığını ve mümkünse edge case durumlarını göster."}
                                </p>
                            </div>
                        )}

                        <textarea
                            value={answerText}
                            onChange={(event) => setAnswerText(event.target.value)}
                            disabled={!!lastFeedback}
                            placeholder={
                                isSqlPractice
                                    ? "SQL sorgunu buraya yaz...\n\nÖrnek:\nSELECT CustomerName, COUNT(*) AS OrderCount\nFROM Orders\nGROUP BY CustomerName\nHAVING COUNT(*) > 3;"
                                    : isCodingPractice
                                        ? "Kodunu buraya yaz...\n\nÖrnek:\npublic int FindSecondLargest(int[] numbers)\n{\n    // çözümünü buraya yaz\n}"
                                        : "Cevabını buraya yaz...\n\nİpucu: Kısa bir giriş yap, kullandığın yaklaşımı anlat ve örnekle güçlendir."
                            }
                            className={`mt-6 min-h-[280px] w-full rounded-3xl border border-white/70 bg-white/85 p-5 text-slate-800 outline-none shadow-inner transition focus:ring-4 focus:ring-violet-200 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-500/20 ${isCodePractice ? "font-mono text-sm leading-7" : "text-sm leading-7"
                                }`}
                        />

                        {isSubmitting && (
                            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-400/20 dark:bg-violet-400/10">
                                <p className="text-sm font-black text-violet-900 dark:text-violet-200">
                                    AI cevabını değerlendiriyor...
                                </p>

                                <p className="mt-1 text-sm leading-6 text-violet-800 dark:text-violet-100">
                                    Cevabın doğruluk, soruya uygunluk, yapı ve gelişim önerileri
                                    açısından inceleniyor.
                                </p>
                            </div>
                        )}

                        {message && (
                            <p className="mt-4 text-center text-sm font-semibold text-rose-600 dark:text-rose-300">
                                {message}
                            </p>
                        )}

                        <button
                            onClick={handleSubmitAnswer}
                            disabled={isSubmitting || !!lastFeedback}
                            className="mt-5 w-full rounded-full bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            {isSubmitting
                                ? "AI cevabını değerlendiriyor..."
                                : isSqlPractice
                                    ? "SQL Cevabını Gönder"
                                    : isCodingPractice
                                        ? "Kod Cevabını Gönder"
                                        : "Cevabımı Gönder"}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                AI Geri Bildirim
                            </p>

                            {!lastFeedback ? (
                                <div className="mt-5 rounded-3xl border border-white/60 bg-white/75 p-6 dark:border-slate-700 dark:bg-slate-950/40">
                                    <p className="font-black text-slate-800 dark:text-white">
                                        Cevabını gönderdikten sonra AI koç raporu burada görünecek.
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {isSqlPractice
                                            ? "SQL cevaplarında SELECT, FROM, WHERE, JOIN, GROUP BY ve HAVING gibi anahtar kelimeleri doğru kullanmaya çalış."
                                            : isCodingPractice
                                                ? "Kod cevaplarında fonksiyon adı, parametreler, algoritma mantığı, dönüş değeri ve edge case durumlarını net göstermeye çalış."
                                                : "Güçlü cevaplar genelde problemi, yaklaşımını, kullandığın araçları ve sonucu net şekilde anlatır."}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-3xl border border-white/70 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-950/40">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-black text-slate-950 dark:text-white">
                                            Skor
                                        </p>

                                        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                                            {lastFeedback.score}/100
                                        </span>
                                    </div>

                                    <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
                                        {lastFeedback.feedback}
                                    </p>

                                    <button
                                        onClick={handleNextQuestion}
                                        className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-black text-white shadow transition hover:scale-105"
                                    >
                                        {session &&
                                            currentQuestionIndex === session.questions.length - 1
                                            ? "Sonucu Gör"
                                            : "Sonraki Soru"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Cevap İpucu
                            </p>

                            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
                                Cevabını verirken şu yapıyı kullanabilirsin: Önce problemi veya
                                kavramı tanımla, sonra yaklaşımını anlat, kullandığın teknoloji
                                veya yöntemi belirt ve mümkünse sonucu örnekle.
                            </p>

                            <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                    Mini Formül
                                </p>

                                <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Tanım → Yaklaşım → Örnek → Sonuç
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}