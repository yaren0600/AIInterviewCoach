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
                    "Question text could not be loaded.",
                category: question.category ?? question.questionCategory ?? "General",
                orderNo:
                    question.orderNo ?? question.orderNumber ?? question.order ?? index + 1,
            };
        })
        .filter((question) => question.id !== 0);

    return {
        sessionId: normalizedSessionId,
        positionName: rawSession.positionName ?? "Interview Session",
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
                        "Interview session data could not be found. Please start a new interview."
                    );
                    return;
                }

                const parsedInterviewSession = JSON.parse(
                    storedInterviewSession
                ) as RawInterviewSessionDetail;

                console.log("Stored interview session:", parsedInterviewSession);

                const normalizedInterviewSession = normalizeInterviewSession(
                    parsedInterviewSession,
                    sessionId
                );

                console.log("Normalized interview session:", normalizedInterviewSession);

                if (normalizedInterviewSession.questions.length === 0) {
                    setMessage("No questions were found for this interview session.");
                    return;
                }

                setSession(normalizedInterviewSession);
            } catch {
                setMessage("An error occurred while loading interview session.");
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
            setMessage("Please write your answer first.");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await api.post(
                "/Interviews/answer",
                {
                    questionId: currentQuestion.id,
                    userAnswer: answerText,
                }
            );

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
                    "An error occurred while submitting your answer."
                );
            } else {
                setMessage("An error occurred while submitting your answer.");
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
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading interview session...
                    </p>
                </div>
            </main>
        );
    }

    if (message && !session) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center px-4">
                <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center animate-fade-up">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Interview could not be loaded
                    </h2>

                    <p className="text-rose-600 mt-3">{message}</p>

                    <button
                        onClick={() => router.push("/interviews/start")}
                        className="mt-6 rounded-full bg-slate-900 text-white px-6 py-3 font-medium hover:scale-105 transition"
                    >
                        Back to start
                    </button>
                </div>
            </main>
        );
    }

    const currentQuestion = session?.questions[currentQuestionIndex];

    //Eğer soru kategorisi SQL Practice ise sayfa SQL kod yazma moduna geçsin.
    const isSqlPractice =
        currentQuestion?.category?.toLowerCase().includes("sql") ?? false;

    const isCodingPractice =
        currentQuestion?.category?.toLowerCase().includes("coding practice") ?? false;

    const isCodePractice = isSqlPractice || isCodingPractice;
    const progressPercentage = session
        ? Math.round(((currentQuestionIndex + 1) / session.questions.length) * 100)
        : 0;

    return (
        <main className="min-h-screen dashboard-gradient-bg relative overflow-hidden px-4 md:px-6 py-8">
            <div className="absolute top-8 left-8 w-44 h-44 bg-pink-300/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-24 right-10 w-56 h-56 bg-violet-300/25 rounded-full blur-3xl animate-float-reverse" />
            <div className="absolute bottom-10 left-1/4 w-52 h-52 bg-cyan-300/25 rounded-full blur-3xl animate-soft-pulse" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="interview-studio-card rounded-[2rem] p-6 md:p-8 animate-fade-up">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
                                Live Interview Session
                            </div>

                            <h1 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                Practice your answer
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    one question at a time
                                </span>
                            </h1>

                            <p className="mt-4 text-slate-600 max-w-2xl text-sm md:text-base leading-7">
                                Answer each question carefully. After submitting, you will get a
                                score and feedback before moving to the next question.
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-white/70 border border-white/70 p-6 shadow-xl max-w-md w-full">
                            <p className="text-sm font-bold text-slate-700">
                                Session overview
                            </p>

                            <p className="mt-4 text-2xl font-black text-slate-900">
                                {session?.positionName}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                                {session?.resumeFileName
                                    ? `Resume: ${session.resumeFileName}`
                                    : "Standard role-based interview"}
                            </p>

                            <div className="mt-5">
                                <div className="flex justify-between text-xs font-semibold text-slate-600">
                                    <span>
                                        Question {currentQuestionIndex + 1} of{" "}
                                        {session?.questions.length}
                                    </span>
                                    <span>{progressPercentage}%</span>
                                </div>

                                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="glass-card rounded-3xl px-4 py-3 mt-5 animate-fade-up">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={() => router.push("/resumes")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Resumes
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Start Interview
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/70 text-rose-600 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 mt-8">
                    <div className="glass-card rounded-3xl p-6 animate-fade-up">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                            Question
                        </p>

                        <h2 className="mt-4 text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                            {currentQuestion?.text ?? "Question text could not be loaded."}
                        </h2>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold">
                                {currentQuestion?.category}
                            </span>

                            <span className="rounded-full bg-sky-100 text-sky-600 px-3 py-1 text-xs font-bold">
                                Order {currentQuestion?.orderNo}
                            </span>
                        </div>

                        {isCodePractice && (
                            <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-sky-700 font-bold">
                                    {isSqlPractice ? "SQL Coding Mode" : "Coding Practice Mode"}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-sky-900">
                                    {isSqlPractice
                                        ? "Bu soruda cevabını mümkünse SQL sorgusu yazarak ver. Önce sorguyu yaz, sonra kısa bir cümleyle ne yaptığını açıkla."
                                        : "Bu soruda cevabını kod yazarak ver. Fonksiyon/metot adını, parametreleri ve temel algoritma mantığını net göstermeye çalış."}
                                </p>
                            </div>
                        )}

                        <textarea
                            value={answerText}
                            onChange={(event) => setAnswerText(event.target.value)}
                            disabled={!!lastFeedback}
                            placeholder={
                                isSqlPractice
                                    ? "SQL sorgunu buraya yaz...\n\nÖrnek:\nSELECT *\nFROM Customers\nWHERE City = 'Konya';"
                                    : isCodingPractice
                                        ? "Kodunu buraya yaz...\n\nÖrnek:\npublic int FindMax(int[] numbers)\n{\n    return numbers.Max();\n}"
                                        : "Cevabını buraya yaz..."
                            }
                            className={`mt-6 w-full min-h-[260px] rounded-3xl bg-white/80 border border-white/70 p-5 text-slate-800 outline-none focus:ring-4 focus:ring-violet-200 disabled:opacity-70 ${isCodePractice ? "font-mono text-sm leading-7" : ""
                                }`}
                        />

                        {message && (
                            <p className="mt-4 text-sm text-center text-rose-600">
                                {message}
                            </p>
                        )}

                        <button
                            onClick={handleSubmitAnswer}
                            disabled={isSubmitting || !!lastFeedback}
                            className="mt-5 w-full rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 disabled:opacity-60 transition"
                        >

                            {isSubmitting
                                ? "Submitting..."
                                : isSqlPractice
                                    ? "Submit SQL Answer"
                                    : isCodingPractice
                                        ? "Submit Code Answer"
                                        : "Submit Answer"}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card rounded-3xl p-6 animate-fade-up">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                Feedback
                            </p>

                            {!lastFeedback ? (
                                <div className="mt-5 rounded-3xl bg-white/70 border border-white/60 p-6">
                                    <p className="font-bold text-slate-800">
                                        Feedback will appear here after you submit your answer.
                                    </p>

                                    <p className="text-sm text-slate-500 mt-2 leading-6">
                                        {isSqlPractice
                                            ? "SQL cevaplarında sorguyu açık yazmaya çalış. SELECT, FROM, WHERE, JOIN, GROUP BY gibi anahtar kelimeleri doğru kullan."
                                            : isCodingPractice
                                                ? "Kod cevaplarında çalışır mantığı göstermeye çalış. Fonksiyon adı, parametreler, döngü/koşul kullanımı ve dönüş değerini net yaz."
                                                : "Try to answer with a clear structure: situation, action, technologies used, and result."}
                                    </p>
                                </div>

                            ) : (
                                <div className="mt-5 rounded-3xl bg-white/80 border border-white/70 p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="font-black text-slate-900">Score</p>

                                        <span className="rounded-full bg-emerald-100 text-emerald-600 px-4 py-2 text-sm font-black">
                                            {lastFeedback.score}/100
                                        </span>
                                    </div>

                                    <p className="mt-5 text-sm leading-7 text-slate-700">
                                        {lastFeedback.feedback}
                                    </p>

                                    <button
                                        onClick={handleNextQuestion}
                                        className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-3 font-semibold shadow hover:scale-105 transition"
                                    >
                                        {session &&
                                            currentQuestionIndex === session.questions.length - 1
                                            ? "See Result"
                                            : "Next Question"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="glass-card rounded-3xl p-6 animate-fade-up">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                Answer Tip
                            </p>

                            <p className="mt-4 text-sm leading-7 text-slate-700">
                                Strong answers usually include what the problem was, what you
                                did, which tools or technologies you used, and what the outcome
                                was.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}