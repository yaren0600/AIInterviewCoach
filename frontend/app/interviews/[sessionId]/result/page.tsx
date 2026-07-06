"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, InterviewResult } from "@/types/api";

export default function InterviewResultPage() {
    const router = useRouter();
    const params = useParams();

    const sessionId = params.sessionId as string;

    const [result, setResult] = useState<InterviewResult | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadResult() {
            try {
                const response = await api.get<ApiResponse<InterviewResult>>(
                    `/Interviews/${sessionId}/result`
                );

                if (response.data.success) {
                    setResult(response.data.data);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "An error occurred while loading interview result."
                    );
                } else {
                    setMessage("An error occurred while loading interview result.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadResult();
    }, [router, sessionId]);

    if (isLoading) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading interview result...
                    </p>
                </div>
            </main>
        );
    }

    if (message) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center px-4">
                <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center animate-fade-up">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Result could not be loaded
                    </h2>

                    <p className="text-rose-600 mt-3">{message}</p>

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="mt-6 rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 transition"
                    >
                        Back to dashboard
                    </button>
                </div>
            </main>
        );
    }

    if (!result) {
        return (
            <main className="min-h-screen dashboard-gradient-bg px-6 py-10">
                <div className="mx-auto max-w-5xl">
                    <div className="glass-card rounded-3xl p-8 text-center">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                            Loading
                        </p>

                        <h1 className="mt-3 text-2xl font-black text-slate-900">
                            Sonuç bilgileri yükleniyor...
                        </h1>

                        <p className="mt-2 text-sm text-slate-600">
                            Lütfen birkaç saniye bekle.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen dashboard-gradient-bg relative overflow-hidden px-4 md:px-6 py-8">
            <div className="absolute top-8 left-8 w-44 h-44 bg-pink-300/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-24 right-10 w-56 h-56 bg-violet-300/25 rounded-full blur-3xl animate-float-reverse" />
            <div className="absolute bottom-10 left-1/4 w-52 h-52 bg-cyan-300/25 rounded-full blur-3xl animate-soft-pulse" />

            <div className="max-w-7xl mx-auto relative z-10">
                <section className="interview-studio-card rounded-[2rem] p-8 md:p-10 animate-fade-up text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
                        Interview Completed
                    </div>

                    <h1 className="mt-6 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                        Your interview result
                        <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                            {" "}
                            is ready
                        </span>
                    </h1>

                    <p className="mt-4 text-slate-600 max-w-2xl mx-auto leading-7">
                        Review your score, strengths, improvement areas, and personalized
                        study recommendations.
                    </p>

                    <div className="glass-card rounded-3xl p-6 mt-8">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                    Question Review
                                </p>

                                <h2 className="mt-3 text-2xl font-black text-slate-900">
                                    Cevaplarının detaylı analizi
                                </h2>

                                <p className="mt-2 text-sm text-slate-600">
                                    Her soru için verdiğin cevap, puan ve geri bildirimi buradan inceleyebilirsin.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {result.questions && result.questions.length > 0 ? (
                                result.questions.map((question, index) => (
                                    <div
                                        key={question.questionId}
                                        className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                                        Question {index + 1}
                                                    </span>

                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                        {question.category}
                                                    </span>

                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                        {question.difficulty}
                                                    </span>
                                                </div>

                                                <h3 className="mt-4 text-lg font-black text-slate-900">
                                                    {question.questionText}
                                                </h3>
                                            </div>

                                            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-white">
                                                <p className="text-xs font-semibold text-white/70">Score</p>
                                                <p className="text-2xl font-black">
                                                    {question.score ?? "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                                                    Your Answer
                                                </p>

                                                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                                                    {question.userAnswer && question.userAnswer.trim().length > 0
                                                        ? question.userAnswer
                                                        : "Bu soru için henüz cevap bulunmuyor."}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                                                    Feedback
                                                </p>

                                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                                    {question.feedback ?? "Bu soru için feedback bulunmuyor."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-bold">
                                                Daha Güçlü Cevap Örneği
                                            </p>

                                            <p className="mt-3 text-sm leading-6 text-emerald-900">
                                                {question.betterAnswerExample ||
                                                    "Bu soru için örnek cevap henüz oluşturulamadı."}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
                                    <p className="font-bold text-slate-700">
                                        Henüz soru-cevap detayı bulunamadı.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                        Session ID: <span className="font-bold">{sessionId}</span>
                    </p>
                </section>

                {result && (
                    <>
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <p className="text-sm text-slate-500 font-semibold">
                                    Total Score
                                </p>

                                <p className="text-5xl font-black text-slate-900 mt-4">
                                    {result.totalScore}
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Overall interview performance score
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <p className="text-sm text-slate-500 font-semibold">
                                    Position
                                </p>

                                <p className="text-2xl font-black text-violet-600 mt-4">
                                    {result.positionName}
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Target role for this session
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <p className="text-sm text-slate-500 font-semibold">
                                    Session
                                </p>

                                <p className="text-5xl font-black text-sky-600 mt-4">
                                    #{result.sessionId}
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Completed interview session
                                </p>
                            </div>
                        </section>

                        <section className="glass-card rounded-3xl p-6 mt-6 animate-fade-up">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                General Evaluation
                            </p>

                            <p className="mt-4 text-slate-700 leading-7">
                                {result.generalEvaluation}
                            </p>
                        </section>

                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Strong Areas
                                    </h2>

                                    <span className="rounded-full bg-emerald-100 text-emerald-600 px-3 py-1 text-xs font-bold">
                                        Strengths
                                    </span>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {result.strongAreas.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No strong areas found yet.
                                        </p>
                                    ) : (
                                        result.strongAreas.map((area) => (
                                            <div
                                                key={area}
                                                className="rounded-2xl bg-white/75 border border-white/70 p-4 text-sm font-semibold text-slate-700"
                                            >
                                                {area}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Improvement Areas
                                    </h2>

                                    <span className="rounded-full bg-rose-100 text-rose-600 px-3 py-1 text-xs font-bold">
                                        Improve
                                    </span>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {result.improvementAreas.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No improvement areas found.
                                        </p>
                                    ) : (
                                        result.improvementAreas.map((area) => (
                                            <div
                                                key={area}
                                                className="rounded-2xl bg-white/75 border border-white/70 p-4 text-sm font-semibold text-slate-700"
                                            >
                                                {area}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Study Recommendations
                                    </h2>

                                    <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold">
                                        Next
                                    </span>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {result.studyRecommendations.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No study recommendations found.
                                        </p>
                                    ) : (
                                        result.studyRecommendations.map((recommendation) => (
                                            <div
                                                key={recommendation}
                                                className="rounded-2xl bg-white/75 border border-white/70 p-4 text-sm font-semibold text-slate-700"
                                            >
                                                {recommendation}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="glass-card rounded-3xl p-6 mt-6 animate-fade-up">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                        Category Performance
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                                        Score by interview category
                                    </h2>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                {result.categoryPerformances.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        No category performance found.
                                    </p>
                                ) : (
                                    result.categoryPerformances.map((category) => (
                                        <div
                                            key={category.category}
                                            className="rounded-2xl bg-white/75 border border-white/70 p-5"
                                        >
                                            <div className="flex justify-between text-sm font-semibold text-slate-700">
                                                <span>{category.category}</span>
                                                <span>{category.averageScore}</span>
                                            </div>

                                            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
                                                    style={{ width: `${category.averageScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="glass-card rounded-3xl p-6 mt-6 animate-fade-up">
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 hover:scale-105 transition"
                                >
                                    Back to dashboard
                                </button>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-white text-slate-700 px-6 py-3 font-semibold shadow hover:scale-105 transition"
                                >
                                    Start new interview
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}