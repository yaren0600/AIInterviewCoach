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

        if (resumeId) {
            void loadAnalysis();
        }
    }, [resumeId, router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (isLoading) {
        return (
            <PageShell center>
                <div className="relative z-10 rounded-3xl border border-white/70 bg-white/[0.76] px-8 py-6 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-100">
                        CV analizi yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Becerilerin ve önerilen roller hazırlanıyor.
                    </p>
                </div>
            </PageShell>
        );
    }

    if (message) {
        return (
            <PageShell center>
                <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.76] p-8 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                    <h2 className="relative z-10 text-2xl font-black text-slate-950 dark:text-white">
                        Analiz yüklenemedi
                    </h2>

                    <p className="relative z-10 mt-3 text-sm font-semibold leading-6 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/resumes")}
                        className="shine-button relative z-10 mt-6 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                    >
                        CV’lerime Dön
                    </button>
                </div>
            </PageShell>
        );
    }

    if (!analysis) {
        return (
            <PageShell center>
                <div className="relative z-10 rounded-3xl border border-white/70 bg-white/[0.76] p-8 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <h1 className="text-2xl font-black text-slate-950 dark:text-white">
                        Analiz bilgisi bulunamadı.
                    </h1>

                    <button
                        onClick={() => router.push("/resumes")}
                        className="shine-button mt-6 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                    >
                        CV’lerime Dön
                    </button>
                </div>
            </PageShell>
        );
    }

    const detectedSkills = analysis.detectedSkills ?? [];
    const missingSkills = analysis.missingSkills ?? [];
    const suggestedPositions = analysis.suggestedPositions ?? [];

    return (
        <PageShell>
            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.72] p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/55 md:p-8">
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.1fr_0.9fr]">
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

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <HeroMetric
                                    value={detectedSkills.length}
                                    label="tespit edilen beceri"
                                />

                                <HeroMetric
                                    value={missingSkills.length}
                                    label="gelişim alanı"
                                />

                                <HeroMetric
                                    value={suggestedPositions.length}
                                    label="önerilen rol"
                                />
                            </div>
                        </div>

                        <div className="float-card relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl dark:border-violet-400/25 dark:bg-slate-950/60 dark:shadow-violet-500/10">
                            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                            <p className="relative z-10 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Analiz Özeti
                            </p>

                            <p className="relative z-10 mt-5 text-6xl font-black text-slate-950 dark:text-white">
                                {detectedSkills.length}
                            </p>

                            <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                tespit edilen teknik beceri
                            </p>

                            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
                                <MiniLabel label="Beceri" tone="rose" />
                                <MiniLabel label="Rol" tone="violet" />
                                <MiniLabel label="Öneri" tone="sky" />
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="mt-5 rounded-3xl border border-white/70 bg-white/65 px-4 py-3 shadow-xl shadow-violet-500/5 backdrop-blur-2xl dark:border-violet-400/15 dark:bg-slate-950/45">
                    <div className="flex flex-wrap gap-3">
                        <NavButton label="Dashboard" onClick={() => router.push("/dashboard")} />

                        <button
                            onClick={() => router.push("/resumes")}
                            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
                        >
                            CV’lerim
                        </button>

                        <NavButton
                            label="Yeni Mülakat"
                            onClick={() => router.push("/interviews/start")}
                        />

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
                </nav>

                <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <SectionTitle
                        eyebrow="Dosya"
                        title={analysis.fileName}
                        description="CV içeriğinden çıkarılan kısa özet ve analiz bilgileri."
                    />

                    <p className="mt-5 rounded-3xl border border-white/70 bg-white/70 p-5 text-sm leading-7 text-slate-700 shadow-inner dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                        {analysis.summary || "CV özeti bulunamadı."}
                    </p>
                </section>

                <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <AnalysisCard
                        title="Tespit Edilen Beceriler"
                        badge="Bulundu"
                        items={detectedSkills}
                        emptyText="Teknik beceri tespit edilemedi."
                        tone="emerald"
                    />

                    <AnalysisCard
                        title="Eksik Görünen Beceriler"
                        badge="Geliştir"
                        items={missingSkills}
                        emptyText="Eksik beceri bulunamadı."
                        tone="rose"
                    />

                    <AnalysisCard
                        title="Önerilen Pozisyonlar"
                        badge="Uyum"
                        items={suggestedPositions}
                        emptyText="Önerilen pozisyon bulunamadı."
                        tone="violet"
                    />
                </section>

                <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <SectionTitle
                            eyebrow="Sonraki Adım"
                            title="CV odaklı mülakat pratiği başlat"
                            description="Bu CV’yi kullanarak tespit edilen becerilerine ve önerilen rollere göre daha kişisel mülakat soruları oluşturabilirsin."
                        />

                        <button
                            onClick={() => router.push(`/interviews/start?resumeId=${resumeId}`)}
                            className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                        >
                            Bu CV ile Mülakat Başlat
                        </button>
                    </div>
                </section>
            </div>
        </PageShell>
    );
}

function PageShell({
    children,
    center = false,
}: {
    children: React.ReactNode;
    center?: boolean;
}) {
    return (
        <main
            className={`neon-lab-bg relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 dark:text-slate-100 md:px-6 ${center ? "flex items-center justify-center" : ""
                }`}
        >
            <div className="lab-grid absolute inset-0" />
            <div className="lab-noise absolute inset-0" />
            <div className="lab-scanline" />
            <div className="lab-vignette absolute inset-0" />

            <div className="neon-orb absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-pink-300/28 blur-[120px] dark:bg-pink-500/18" />
            <div className="neon-orb-reverse absolute -right-24 top-16 h-[34rem] w-[34rem] rounded-full bg-violet-300/28 blur-[130px] dark:bg-violet-500/18" />
            <div className="absolute left-1/2 top-[38%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-300/16 blur-[150px] dark:bg-sky-500/12" />
            <div className="absolute bottom-0 left-[12%] h-80 w-80 rounded-full bg-cyan-300/18 blur-[120px] dark:bg-cyan-500/10" />
            <div className="absolute bottom-8 right-[10%] h-72 w-72 rounded-full bg-fuchsia-200/22 blur-[110px] dark:bg-fuchsia-500/12" />

            {children}
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
    value: string | number;
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

function MiniLabel({
    label,
    tone,
}: {
    label: string;
    tone: "rose" | "violet" | "sky";
}) {
    const toneClass =
        tone === "rose"
            ? "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
            : tone === "violet"
                ? "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
                : "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300";

    return (
        <div className={`rounded-2xl px-3 py-3 text-center text-xs font-black ${toneClass}`}>
            {label}
        </div>
    );
}

function SectionTitle({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {eyebrow}
            </p>

            <h2 className="mt-3 break-words text-2xl font-black text-slate-950 dark:text-white">
                {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
            </p>
        </div>
    );
}

function AnalysisCard({
    title,
    badge,
    items,
    emptyText,
    tone,
}: {
    title: string;
    badge: string;
    items: string[];
    emptyText: string;
    tone: "emerald" | "rose" | "violet";
}) {
    const badgeClass =
        tone === "emerald"
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
            : tone === "rose"
                ? "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
                : "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300";

    const itemClass =
        tone === "emerald"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
            : tone === "rose"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                : "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300";

    return (
        <div className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {title}
                </h2>

                <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>
                    {badge}
                </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {items.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {emptyText}
                    </p>
                ) : (
                    items.map((item, index) => (
                        <span
                            key={`${item}-${index}`}
                            className={`rounded-full px-4 py-2 text-sm font-black ${itemClass}`}
                        >
                            {item}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}