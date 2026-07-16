"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, StudyPlan } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function StudyPlanPage() {
    const router = useRouter();

    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadStudyPlan() {
            try {
                const response = await api.get<ApiResponse<StudyPlan>>(
                    "/StudyPlan/my-plan"
                );

                if (response.data.success) {
                    setStudyPlan(response.data.data);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "AI gelişim planı yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("AI gelişim planı yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadStudyPlan();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        AI gelişim planın hazırlanıyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Mülakat geçmişin analiz ediliyor.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="neon-lab-bg relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 dark:text-slate-100 md:px-6">
            <div className="lab-grid absolute inset-0" />
            <div className="lab-noise absolute inset-0" />
            <div className="lab-scanline" />
            <div className="lab-vignette absolute inset-0" />

            <div className="neon-orb absolute -left-16 top-0 h-[30rem] w-[30rem] rounded-full bg-pink-300/28 blur-[120px] dark:bg-pink-500/18" />
            <div className="neon-orb-reverse absolute -right-20 top-10 h-[34rem] w-[34rem] rounded-full bg-violet-300/28 blur-[130px] dark:bg-violet-500/18" />
            <div className="absolute left-1/2 top-[34%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-300/16 blur-[150px] dark:bg-sky-500/12" />
            <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute right-10 top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute bottom-10 left-1/4 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 md:p-8">
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                                    AI Gelişim Planım
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                Mülakat verilerine göre
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    kişisel gelişim
                                </span>{" "}
                                planın
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Sistem geçmiş mülakat cevaplarını, skorlarını ve kategori performanslarını analiz eder.
                                Güçlü alanlarını, gelişim alanlarını ve haftalık çalışma planını tek ekranda gösterir.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                Plan içeriği
                            </p>

                            <div className="mt-5 space-y-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                                <p>✓ Güçlü alan analizi</p>
                                <p>✓ Zayıf alan analizi</p>
                                <p>✓ Teknik çalışma konuları</p>
                                <p>✓ İletişim ve cevap yapısı önerileri</p>
                                <p>✓ 7 günlük haftalık plan</p>
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
                            onClick={() => router.push("/interviews/sessions")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Geçmiş Mülakatlar
                        </button>

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                            AI Gelişim Planım
                        </button>

                        <button
                            onClick={() => router.push("/settings")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Ayarlar
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </nav>

                {message && (
                    <div className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-5 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                            {message}
                        </p>
                    </div>
                )}

                {studyPlan && (
                    <>
                        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Genel Özet
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                AI koçunun genel değerlendirmesi
                            </h2>

                            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                {studyPlan.generalSummary}
                            </p>
                        </section>

                        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <InfoCard
                                title="Güçlü Alanların"
                                badge="Avantaj"
                                items={studyPlan.strongAreas}
                                emptyText="Henüz güçlü alan bulunamadı."
                            />

                            <InfoCard
                                title="Gelişim Alanların"
                                badge="Odak"
                                items={studyPlan.weakAreas}
                                emptyText="Henüz gelişim alanı bulunamadı."
                            />
                        </section>

                        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <InfoCard
                                title="Önerilen Pratik Modları"
                                badge="Mod"
                                items={studyPlan.recommendedPracticeModes}
                                emptyText="Henüz mod önerisi yok."
                            />

                            <InfoCard
                                title="Teknik Odak Konuları"
                                badge="Teknik"
                                items={studyPlan.technicalFocusTopics}
                                emptyText="Henüz teknik konu önerisi yok."
                            />

                            <InfoCard
                                title="Cevap Verme Tarzı"
                                badge="İletişim"
                                items={studyPlan.communicationFocusTopics}
                                emptyText="Henüz iletişim önerisi yok."
                            />
                        </section>

                        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        Haftalık Plan
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                        7 günlük mülakat gelişim rotan
                                    </h2>
                                </div>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-black text-white shadow transition hover:scale-105"
                                >
                                    Pratiğe Başla
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {studyPlan.weeklyPlan.map((item, index) => (
                                    <div
                                        key={`${item.day}-${index}`}
                                        className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                                                {item.day}
                                            </span>

                                            <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                                {item.practiceMode}
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                                            {item.focus}
                                        </h3>

                                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            {item.task}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

function InfoCard({
    title,
    badge,
    items,
    emptyText,
}: {
    title: string;
    badge: string;
    items: string[];
    emptyText: string;
}) {
    return (
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {title}
                </h2>

                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                    {badge}
                </span>
            </div>

            <div className="mt-5 space-y-3">
                {items.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                        {emptyText}
                    </p>
                ) : (
                    items.map((item, index) => (
                        <div
                            key={`${item}-${index}`}
                            className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300"
                        >
                            {item}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}