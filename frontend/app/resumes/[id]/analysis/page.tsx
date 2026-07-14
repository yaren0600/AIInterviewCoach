// id klasörünün köşeli parantezli olma sebebi Next.js'te dinamik route olmasıdır.
// Bu sayede CV id'si değiştiğinde hangi CV için işlem yapıldığı URL üzerinden anlaşılır.

"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, ResumeAnalysis } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function ResumeAnalysisPage() {
    const router = useRouter();
    const params = useParams();

    const resumeId = params.id as string;

    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadAnalysis() {
            try {
                const response = await api.get<ApiResponse<ResumeAnalysis>>(
                    `/Resumes/${resumeId}/analysis`
                );

                if (response.data.success) {
                    setAnalysis(response.data.data);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "CV analizi yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("CV analizi yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadAnalysis();
    }, [resumeId, router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        CV analizi yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Becerilerin ve önerilen roller hazırlanıyor.
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
                        Analiz yüklenemedi
                    </h2>

                    <p className="mt-3 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/resumes")}
                        className="mt-6 rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        CV’lerime Dön
                    </button>
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
                <header className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 md:p-8">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                                    CV Analizi
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                CV’ni mülakattan önce
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    güçlü ve zayıf yönleriyle
                                </span>{" "}
                                incele
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Tespit edilen becerilerini, eksik görünen alanları ve sana uygun
                                pozisyon önerilerini burada görebilirsin. Bu analiz, CV odaklı
                                mülakat sorularını daha kişisel hale getirir.
                            </p>
                        </div>

                        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                Analiz Özeti
                            </p>

                            <p className="mt-4 text-5xl font-black text-slate-950 dark:text-white">
                                {analysis?.detectedSkills.length ?? 0}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                tespit edilen teknik beceri
                            </p>

                            <div className="mt-5 grid grid-cols-3 gap-2">
                                <div className="rounded-2xl bg-rose-100 px-3 py-3 text-center text-xs font-black text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                                    Beceri
                                </div>

                                <div className="rounded-2xl bg-violet-100 px-3 py-3 text-center text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                    Rol
                                </div>

                                <div className="rounded-2xl bg-sky-100 px-3 py-3 text-center text-xs font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                    Öneri
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
                            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
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
                            onClick={() => router.push("/interviews/sessions")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Geçmiş Mülakatlar
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </nav>

                {analysis && (
                    <>
                        <section className="mt-8 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Dosya
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                {analysis.fileName}
                            </h2>

                            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                                {analysis.summary}
                            </p>
                        </section>

                        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                        Tespit Edilen Beceriler
                                    </h2>

                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                                        Bulundu
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {analysis.detectedSkills.length === 0 ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Teknik beceri tespit edilemedi.
                                        </p>
                                    ) : (
                                        analysis.detectedSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                        Eksik Görünen Beceriler
                                    </h2>

                                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                                        Geliştir
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {analysis.missingSkills.length === 0 ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Eksik beceri bulunamadı.
                                        </p>
                                    ) : (
                                        analysis.missingSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                        Önerilen Pozisyonlar
                                    </h2>

                                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                        Uyum
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {analysis.suggestedPositions.length === 0 ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Önerilen pozisyon bulunamadı.
                                        </p>
                                    ) : (
                                        analysis.suggestedPositions.map((position) => (
                                            <span
                                                key={position}
                                                className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
                                            >
                                                {position}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        Sonraki Adım
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                        CV odaklı mülakat pratiği başlat
                                    </h2>

                                    <p className="mt-2 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">
                                        Bu CV’yi kullanarak tespit edilen becerilerine ve önerilen rollere göre
                                        daha kişisel mülakat soruları oluşturabilirsin.
                                    </p>
                                </div>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-black text-white shadow transition hover:scale-105"
                                >
                                    Mülakat Pratiği Başlat
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}