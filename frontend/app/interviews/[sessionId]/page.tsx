"use client";

import axios from "axios";
import { motion, type Variants } from "framer-motion";
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

    const fadeUp: Variants = {
        hidden: {
            opacity: 0,
            y: 24,
        },
        visible: {
            opacity: 1,
            y: 0,
        },
    };

    const staggerContainer: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    if (isLoading) {
        return (
            <main className="neon-lab-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-slate-900 dark:text-slate-100">
                <div className="lab-grid absolute inset-0" />
                <div className="lab-noise absolute inset-0" />
                <div className="lab-scanline" />
                <div className="lab-vignette absolute inset-0" />

                <div className="relative z-10 rounded-3xl border border-white/70 bg-white/[0.76] px-8 py-6 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-100">
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
            <main className="neon-lab-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-slate-900 dark:text-slate-100">
                <div className="lab-grid absolute inset-0" />
                <div className="lab-noise absolute inset-0" />
                <div className="lab-scanline" />
                <div className="lab-vignette absolute inset-0" />

                <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.76] p-8 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                    <h2 className="relative z-10 text-2xl font-black text-slate-950 dark:text-white">
                        Mülakat yüklenemedi
                    </h2>

                    <p className="relative z-10 mt-3 text-sm font-semibold leading-6 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/interviews/start")}
                        className="shine-button relative z-10 mt-6 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
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
        <main className="neon-lab-bg relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 dark:text-slate-100 md:px-6">
            <div className="lab-grid absolute inset-0" />
            <div className="lab-noise absolute inset-0" />
            <div className="lab-scanline" />
            <div className="lab-vignette absolute inset-0" />

            <motion.div
                animate={{
                    x: [0, 24, 0],
                    y: [0, -18, 0],
                    scale: [1, 1.08, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="neon-orb absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-pink-300/28 blur-[120px] dark:bg-pink-500/18"
            />

            <motion.div
                animate={{
                    x: [0, -28, 0],
                    y: [0, 20, 0],
                    scale: [1, 1.12, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="neon-orb-reverse absolute -right-24 top-16 h-[34rem] w-[34rem] rounded-full bg-violet-300/28 blur-[130px] dark:bg-violet-500/18"
            />

            <div className="absolute left-1/2 top-[38%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-300/16 blur-[150px] dark:bg-sky-500/12" />
            <div className="absolute bottom-0 left-[12%] h-80 w-80 rounded-full bg-cyan-300/18 blur-[120px] dark:bg-cyan-500/10" />
            <div className="absolute bottom-8 right-[10%] h-72 w-72 rounded-full bg-fuchsia-200/22 blur-[110px] dark:bg-fuchsia-500/12" />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="relative z-10 mx-auto max-w-7xl"
            >
                <motion.header
                    variants={fadeUp}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.72] p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/55 md:p-8"
                >
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.08fr_0.92fr]">
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
                                gelişim önerisi al. Her cevap mülakat performansını daha görünür
                                hale getirir.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <HeroMetric
                                    value={currentQuestionIndex + 1}
                                    label="aktif soru"
                                />

                                <HeroMetric
                                    value={session?.questions.length ?? 0}
                                    label="toplam soru"
                                />

                                <HeroMetric
                                    value={progressPercentage}
                                    label="ilerleme %"
                                />
                            </div>
                        </div>

                        <motion.div
                            variants={fadeUp}
                            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
                            transition={{ duration: 0.35 }}
                            className="float-card relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl dark:border-violet-400/25 dark:bg-slate-950/60 dark:shadow-violet-500/10"
                        >
                            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                            <p className="relative z-10 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Oturum Özeti
                            </p>

                            <h2 className="relative z-10 mt-3 text-3xl font-black text-slate-950 dark:text-white">
                                {session?.positionName}
                            </h2>

                            <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {session?.resumeFileName
                                    ? `CV: ${session.resumeFileName}`
                                    : "CV olmadan standart mülakat"}
                            </p>

                            <div className="relative z-10 mt-6">
                                <div className="flex justify-between text-xs font-black text-slate-600 dark:text-slate-300">
                                    <span>
                                        Soru {currentQuestionIndex + 1} /{" "}
                                        {session?.questions.length}
                                    </span>

                                    <span>{progressPercentage}%</span>
                                </div>

                                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-rose-400 via-violet-500 to-sky-500 transition-all"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="relative z-10 mt-6 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    Aktif kategori
                                </p>

                                <p className="mt-2 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">
                                    {currentQuestion?.category ?? "Genel"}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.header>

                <motion.nav
                    variants={fadeUp}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="mt-5 rounded-3xl border border-white/70 bg-white/65 px-4 py-3 shadow-xl shadow-violet-500/5 backdrop-blur-2xl dark:border-violet-400/15 dark:bg-slate-950/45"
                >
                    <div className="flex flex-wrap gap-3">
                        <NavButton label="Dashboard" onClick={() => router.push("/dashboard")} />
                        <NavButton label="CV’lerim" onClick={() => router.push("/resumes")} />
                        <NavButton label="Yeni Mülakat" onClick={() => router.push("/interviews/start")} />
                        <NavButton
                            label="Geçmiş Mülakatlar"
                            onClick={() => router.push("/interviews/sessions")}
                        />
                        <NavButton
                            label="AI Gelişim Planım"
                            onClick={() => router.push("/study-plan")}
                        />
                        <NavButton label="Ayarlar" onClick={() => router.push("/settings")} />

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </motion.nav>

                <motion.section
                    variants={staggerContainer}
                    className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]"
                >
                    <motion.div
                        variants={fadeUp}
                        className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Soru
                                </p>

                                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                                    Sıra {currentQuestion?.orderNo}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                    {currentQuestion?.category}
                                </span>

                                {isCodePractice && (
                                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                        Kod/Sorgu Modu
                                    </span>
                                )}
                            </div>
                        </div>

                        <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">
                            {currentQuestion?.text ?? "Soru metni yüklenemedi."}
                        </h2>

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
                            className={`mt-6 min-h-[300px] w-full rounded-3xl border border-white/70 bg-white/85 p-5 text-slate-800 outline-none shadow-inner transition focus:ring-4 focus:ring-violet-200 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-500/20 ${isCodePractice ? "font-mono text-sm leading-7" : "text-sm leading-7"
                                }`}
                        />

                        {isSubmitting && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-400/20 dark:bg-violet-400/10"
                            >
                                <p className="text-sm font-black text-violet-900 dark:text-violet-200">
                                    AI cevabını değerlendiriyor...
                                </p>

                                <p className="mt-1 text-sm leading-6 text-violet-800 dark:text-violet-100">
                                    Cevabın doğruluk, soruya uygunluk, yapı ve gelişim önerileri
                                    açısından inceleniyor.
                                </p>
                            </motion.div>
                        )}

                        {message && (
                            <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/80 p-3 text-center text-sm font-semibold text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                                {message}
                            </p>
                        )}

                        <button
                            onClick={handleSubmitAnswer}
                            disabled={isSubmitting || !!lastFeedback}
                            className="shine-button mt-5 w-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "AI cevabını değerlendiriyor..."
                                : isSqlPractice
                                    ? "SQL Cevabını Gönder"
                                    : isCodingPractice
                                        ? "Kod Cevabını Gönder"
                                        : "Cevabımı Gönder ✨"}
                        </button>
                    </motion.div>

                    <div className="space-y-6">
                        <motion.div
                            variants={fadeUp}
                            className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                        >
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                AI Geri Bildirim
                            </p>

                            {!lastFeedback ? (
                                <div className="mt-5 rounded-3xl border border-white/60 bg-white/75 p-6 dark:border-slate-700 dark:bg-slate-950/40">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 via-violet-500 to-sky-500 text-2xl shadow-xl shadow-violet-500/20">
                                        ✨
                                    </div>

                                    <p className="mt-5 font-black text-slate-800 dark:text-white">
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
                                <motion.div
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-5 rounded-3xl border border-white/70 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-950/40"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-black text-slate-950 dark:text-white">
                                            Skor
                                        </p>

                                        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                                            {lastFeedback.score}/100
                                        </span>
                                    </div>

                                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-violet-500 transition-all"
                                            style={{ width: `${lastFeedback.score}%` }}
                                        />
                                    </div>

                                    <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
                                        {lastFeedback.feedback}
                                    </p>

                                    <button
                                        onClick={handleNextQuestion}
                                        className="shine-button mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                                    >
                                        {session &&
                                            currentQuestionIndex === session.questions.length - 1
                                            ? "Sonucu Gör"
                                            : "Sonraki Soru"}
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                        >
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
                        </motion.div>
                    </div>
                </motion.section>
            </motion.div>
        </main>
    );
}

function NavButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
            {label}
        </button>
    );
}

function HeroMetric({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-4 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/40">
            <p className="text-2xl font-black text-slate-950 dark:text-white">
                {value}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {label}
            </p>
        </div>
    );
}