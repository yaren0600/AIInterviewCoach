"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, InterviewResult } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

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
                        "Mülakat sonucu yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("Mülakat sonucu yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadResult();
    }, [router, sessionId]);

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        Mülakat sonucu yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        AI koç raporun hazırlanıyor.
                    </p>
                </div>
            </main>
        );
    }

    if (message) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                        Sonuç yüklenemedi
                    </h2>

                    <p className="mt-3 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="mt-6 rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        Dashboard’a dön
                    </button>
                </div>
            </main>
        );
    }

    if (!result) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-6 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-3xl border border-white/70 bg-white/75 p-8 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Yükleniyor
                        </p>

                        <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                            Sonuç bilgileri hazırlanıyor...
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Lütfen birkaç saniye bekle.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 py-8 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-slate-100 md:px-6">
            <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute right-10 top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute bottom-10 left-1/4 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-10 mx-auto max-w-7xl">
                <section className="rounded-[2rem] border border-white/70 bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 md:p-10">
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Mülakat Tamamlandı
                        </div>

                        <ThemeToggle />
                    </div>

                    <h1 className="mt-6 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                        AI mülakat sonucun
                        <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                            {" "}
                            hazır
                        </span>
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                        Skorunu, güçlü yönlerini, gelişim alanlarını, AI koç raporunu ve kişisel çalışma önerilerini buradan inceleyebilirsin.
                    </p>

                    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 text-left shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                Toplam Skor
                            </p>

                            <p className="mt-4 text-5xl font-black text-slate-950 dark:text-white">
                                {result.totalScore ?? "-"}
                            </p>

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Genel mülakat performans puanın
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 text-left shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                Hedef Pozisyon
                            </p>

                            <p className="mt-4 text-2xl font-black text-violet-600 dark:text-violet-300">
                                {result.positionName}
                            </p>

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Bu oturumdaki hedef rolün
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 text-left shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                Oturum
                            </p>

                            <p className="mt-4 text-5xl font-black text-sky-600 dark:text-sky-300">
                                #{result.sessionId}
                            </p>

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Tamamlanan mülakat oturumu
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Kişisel Çalışma Planı
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                Sonuçlarına göre önerilen adımlar
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Geliştirmen gereken alanları küçük, uygulanabilir çalışma adımlarına böldük.
                            </p>
                        </div>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            Zayıf Alanlarda Tekrar Pratik Yap
                        </button>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Odak Alanı
                            </p>

                            <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                                {result.improvementAreas && result.improvementAreas.length > 0
                                    ? result.improvementAreas[0]
                                    : "Genel tekrar"}
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Bugünkü ana odağın bu alan olsun. Önce temel kavramları tekrar et, sonra kısa örnek cevaplar hazırla.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                20 Dakikalık Görev
                            </p>

                            <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                                Kısa tekrar yap
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Zayıf olduğun alandan 3 temel kavram seç. Her biri için bir tanım, kullanım amacı ve küçük bir örnek yaz.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Pratik Yöntemi
                            </p>

                            <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                                Sesli cevap pratiği
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Cevaplarını STAR veya tanım-amaç-örnek yapısıyla sesli anlat. Kısa, net ve örnekli cevap vermeye çalış.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                            Önerilen Çalışma Adımları
                        </p>

                        <div className="mt-4 space-y-3">
                            {result.studyRecommendations && result.studyRecommendations.length > 0 ? (
                                result.studyRecommendations.map((recommendation, index) => (
                                    <div
                                        key={`${recommendation}-${index}`}
                                        className="flex gap-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-950/40"
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white dark:bg-emerald-300 dark:text-slate-950">
                                            {index + 1}
                                        </span>

                                        <p className="text-sm leading-6 text-emerald-950 dark:text-emerald-100">
                                            {recommendation}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm leading-6 text-emerald-950 dark:text-emerald-100">
                                    Genel performansın iyi görünüyor. Yine de cevaplarını daha fazla örnek ve teknik detayla güçlendirebilirsin.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Genel Değerlendirme
                    </p>

                    <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">
                        {result.generalEvaluation}
                    </p>
                </section>

                <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                Güçlü Alanlar
                            </h2>

                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                                Güçlü
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {result.strongAreas.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Henüz güçlü alan bulunamadı.
                                </p>
                            ) : (
                                result.strongAreas.map((area) => (
                                    <div
                                        key={area}
                                        className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                                    >
                                        {area}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                Gelişim Alanları
                            </h2>

                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                                Geliştir
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {result.improvementAreas.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Henüz gelişim alanı bulunamadı.
                                </p>
                            ) : (
                                result.improvementAreas.map((area) => (
                                    <div
                                        key={area}
                                        className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                                    >
                                        {area}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                Çalışma Önerileri
                            </h2>

                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                Sonraki
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {result.studyRecommendations.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Henüz çalışma önerisi bulunamadı.
                                </p>
                            ) : (
                                result.studyRecommendations.map((recommendation) => (
                                    <div
                                        key={recommendation}
                                        className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                                    >
                                        {recommendation}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Kategori Performansı
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                Mülakat kategorilerine göre skor
                            </h2>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {result.categoryPerformances.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Henüz kategori performansı bulunamadı.
                            </p>
                        ) : (
                            result.categoryPerformances.map((category) => (
                                <div
                                    key={category.category}
                                    className="rounded-2xl border border-white/70 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-950/40"
                                >
                                    <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
                                        <span>{category.category}</span>
                                        <span>{category.averageScore}</span>
                                    </div>

                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
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

                <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Soru Analizi
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                Cevaplarının detaylı incelemesi
                            </h2>

                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Her soru için cevabını, skorunu ve AI koç raporunu buradan inceleyebilirsin.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {result.questions && result.questions.length > 0 ? (
                            result.questions.map((question, index) => (
                                <div
                                    key={question.questionId}
                                    className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                                                    Soru {index + 1}
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {question.category}
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {question.difficulty}
                                                </span>
                                            </div>

                                            <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                                                {question.questionText}
                                            </h3>
                                        </div>

                                        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-white dark:bg-white dark:text-slate-950">
                                            <p className="text-xs font-bold opacity-70">Skor</p>
                                            <p className="text-2xl font-black">
                                                {question.score ?? "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-900">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                            Cevabın
                                        </p>

                                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
                                            {question.userAnswer && question.userAnswer.trim().length > 0
                                                ? question.userAnswer
                                                : "Bu soru için cevap bulunmuyor."}
                                        </p>
                                    </div>

                                    {(question.feedback ||
                                        question.strongPoints?.length > 0 ||
                                        question.improvementPoints?.length > 0 ||
                                        question.betterAnswerExample) && (
                                        <div className="mt-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 text-left shadow-sm dark:border-violet-400/20 dark:from-violet-950/30 dark:via-slate-950/70 dark:to-fuchsia-950/20">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                                                        AI Koç Raporu
                                                    </p>

                                                    <h4 className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                                                        Bu cevaba özel değerlendirme
                                                    </h4>

                                                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                        Geri bildirim, güçlü yönler, gelişim alanları ve daha iyi cevap örneği bu raporda özetlenir.
                                                    </p>
                                                </div>

                                                <div className="hidden rounded-2xl bg-violet-100 px-3 py-2 text-xs font-black text-violet-700 dark:bg-violet-400/10 dark:text-violet-300 md:block">
                                                    AI
                                                </div>
                                            </div>

                                            {question.feedback && (
                                                <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                        Geri Bildirim
                                                    </p>

                                                    <p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-300">
                                                        {question.feedback}
                                                    </p>
                                                </div>
                                            )}

                                            {(question.strongPoints?.length > 0 ||
                                                question.improvementPoints?.length > 0) && (
                                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                    {question.strongPoints?.length > 0 && (
                                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300 dark:text-slate-950">
                                                                    ✓
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                                                        Güçlü Yönler
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-emerald-900/70 dark:text-emerald-100">
                                                                        Cevabında iyi olan noktalar
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
                                                                {question.strongPoints.map((point, pointIndex) => (
                                                                    <li key={pointIndex} className="flex gap-3">
                                                                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                                                        <span>{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {question.improvementPoints?.length > 0 && (
                                                        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-300 dark:text-slate-950">
                                                                    !
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                                                                        Gelişim Alanları
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-amber-900/70 dark:text-amber-100">
                                                                        Bir sonraki cevapta geliştirebileceğin noktalar
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <ul className="mt-4 space-y-3 text-sm leading-6 text-amber-950 dark:text-amber-100">
                                                                {question.improvementPoints.map((point, pointIndex) => (
                                                                    <li key={pointIndex} className="flex gap-3">
                                                                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                                                        <span>{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {question.betterAnswerExample && (
                                                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/10">
                                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                                                        Daha Güçlü Cevap Örneği
                                                    </p>

                                                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-indigo-950 dark:text-indigo-100">
                                                        {question.betterAnswerExample}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60">
                                <p className="font-bold text-slate-700 dark:text-slate-300">
                                    Henüz soru-cevap detayı bulunamadı.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            Dashboard’a Dön
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white px-6 py-3 font-bold text-slate-700 shadow transition hover:scale-105 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Yeni Mülakat Başlat
                        </button>
                    </div>

                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        Oturum ID: <span className="font-bold">{sessionId}</span>
                    </p>
                </section>
            </div>
        </main>
    );
}