"use client";

import axios from "axios";
import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, DashboardResponse } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardPage() {
    const router = useRouter();

    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadDashboard() {
            try {
                const response = await api.get<ApiResponse<DashboardResponse>>(
                    "/Dashboard"
                );

                if (response.data.success) {
                    setDashboard(response.data.data);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "Dashboard verileri yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("Dashboard verileri yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadDashboard();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const interviewReadiness = Math.min(
        100,
        Math.max(0, Number(dashboard?.averageScore ?? 0))
    );

    const practiceCompletion = Math.min(
        100,
        Math.max(0, Number(dashboard?.completionRate ?? 0))
    );

    const focusCategory = dashboard?.weakestCategory || "Henüz veri oluşmadı";

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
                staggerChildren: 0.12,
            },
        },
    };

    const statCards = dashboard
        ? [
            {
                title: "Toplam Pratik",
                value: dashboard.totalInterviews,
                badge: "Oturum",
                description: "Başlatılan toplam mülakat pratiği",
                badgeClass:
                    "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
            },
            {
                title: "Tamamlanan",
                value: dashboard.completedInterviews,
                badge: "Bitti",
                description: "AI geri bildirimi alınan oturumlar",
                badgeClass:
                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
            },
            {
                title: "Hazırlık Skoru",
                value: dashboard.averageScore ?? "-",
                badge: "Skor",
                description: "Cevaplarından hesaplanan ortalama skor",
                badgeClass:
                    "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
            },
            {
                title: "Tamamlama Oranı",
                value: `${dashboard.completionRate}%`,
                badge: "İlerleme",
                description: "Tüm pratiklerindeki genel ilerleme",
                badgeClass:
                    "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
            },
        ]
        : [];

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        Dashboard yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Yapay zeka mülakat koçun hazırlanıyor.
                    </p>
                </div>
            </main>
        );
    }

    if (message) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Bir sorun oluştu
                    </h2>

                    <p className="mt-3 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/login")}
                        className="mt-6 rounded-full bg-slate-900 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        Giriş ekranına dön
                    </button>
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
                className="neon-orb absolute -left-16 top-0 h-[30rem] w-[30rem] rounded-full bg-pink-300/28 blur-[120px] dark:bg-pink-500/18"
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
                className="neon-orb-reverse absolute -right-20 top-10 h-[34rem] w-[34rem] rounded-full bg-violet-300/28 blur-[130px] dark:bg-violet-500/18"
            />

            <div className="absolute left-1/2 top-[34%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-300/16 blur-[150px] dark:bg-sky-500/12" />
            <div className="absolute bottom-0 left-[16%] h-80 w-80 rounded-full bg-cyan-300/18 blur-[120px] dark:bg-cyan-500/10" />
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
                    className="rounded-[2rem] border border-white/70 bg-white/[0.72] p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/55 md:p-8"
                >
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Yapay Zeka Mülakat Koçu
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                Mülakat pratiğini
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    kişisel AI koçunla
                                </span>{" "}
                                güçlendir
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                CV’ne, hedef pozisyonuna ve seçtiğin mülakat moduna göre
                                yapay zeka destekli sorular üret; cevaplarını analiz et,
                                güçlü yönlerini ve gelişim alanlarını tek ekranda gör.
                            </p>

                            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-7 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                                >
                                    Mülakata Başla ✨
                                </button>

                                <button
                                    onClick={() => router.push("/resumes")}
                                    className="rounded-full border border-violet-200 bg-white/80 px-7 py-3 font-black text-violet-700 shadow-lg transition hover:scale-105 hover:bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/20"
                                >
                                    CV Yükle
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="rounded-full border border-slate-300 bg-white/60 px-6 py-3 font-bold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        </div>

                        <motion.div
                            variants={fadeUp}
                            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
                            transition={{ duration: 0.35 }}
                            className="float-card relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl dark:border-violet-400/25 dark:bg-slate-950/60 dark:shadow-violet-500/10 md:p-6"
                        >
                            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/25 blur-3xl" />
                            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/40" />

                            <div className="relative z-10 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                        AI Coach Live Panel
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Cevapların gerçek zamanlı analiz edilir
                                    </p>
                                </div>

                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                    <span className="soft-pulse h-2 w-2 rounded-full bg-emerald-500" />
                                    Live
                                </span>
                            </div>

                            <div className="relative z-10 mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <div className="min-h-[160px] rounded-3xl bg-slate-950 p-5 text-white shadow-xl dark:bg-black/60">
                                    <p className="text-xs text-slate-300">
                                        Mülakat sorusu
                                    </p>

                                    <p className="mt-3 text-base font-semibold leading-7">
                                        “En güçlü backend projenizi teknik olarak nasıl anlatırsınız?”
                                    </p>

                                    <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                                        Rol odaklı soru
                                    </div>
                                </div>

                                <div className="min-h-[160px] rounded-3xl border border-slate-100 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                    <p className="text-xs font-black text-violet-600 dark:text-violet-300">
                                        CV içgörüsü
                                    </p>

                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        CV içeriğinden ASP.NET Core, SQL ve REST API becerileri
                                        algılandı.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                                            Backend
                                        </span>

                                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                            API
                                        </span>

                                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                            SQL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 mt-4 rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    Canlı performans özeti
                                </p>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <span>Mülakat hazırlık skoru</span>
                                            <span>{dashboard?.averageScore ?? "-"}%</span>
                                        </div>

                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-rose-400 to-violet-500 transition-all"
                                                style={{ width: `${interviewReadiness}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <span>Pratik tamamlama oranı</span>
                                            <span>{dashboard?.completionRate ?? 0}%</span>
                                        </div>

                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-500 transition-all"
                                                style={{ width: `${practiceCompletion}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                            Bugünkü odak
                                        </p>

                                        <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                                            {focusCategory}
                                        </p>
                                    </div>
                                </div>
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
                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
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

                        <button
                            onClick={() => router.push("/study-plan")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            AI Gelişim Planım
                        </button>

                        <button
                            onClick={() => router.push("/settings")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Ayarlar
                        </button>
                    </div>
                </motion.nav>

                {dashboard && (
                    <>
                        <motion.section
                            variants={staggerContainer}
                            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
                        >
                            {statCards.map((card) => (
                                <motion.div
                                    key={card.title}
                                    variants={fadeUp}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    transition={{ duration: 0.25 }}
                                    className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-xl transition dark:border-slate-700 dark:bg-slate-900/70"
                                >
                                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-pink-300/40 to-violet-300/30 blur-2xl transition group-hover:scale-125 dark:from-pink-500/10 dark:to-violet-500/10" />
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-pink-400 via-violet-400 to-sky-400 opacity-0 transition group-hover:opacity-100" />

                                    <div className="relative z-10 flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                            {card.title}
                                        </p>

                                        <span className={`rounded-full px-3 py-1 text-xs font-black ${card.badgeClass}`}>
                                            {card.badge}
                                        </span>
                                    </div>

                                    <p className="relative z-10 mt-4 text-4xl font-black text-slate-950 dark:text-white">
                                        {card.value}
                                    </p>

                                    <p className="relative z-10 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        {card.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.section>

                        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
                            <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-500/10" />

                            <div className="relative z-10 grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[1fr_0.75fr]">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                        Bugünün Odağı
                                    </div>

                                    <h2 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">
                                        Bugünkü çalışma odağın:
                                        <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                            {" "}
                                            {dashboard.weakestCategory || "Genel tekrar"}
                                        </span>
                                    </h2>

                                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                        {dashboard.latestRecommendation ||
                                            "Bugün kısa bir pratik oturumu başlatarak güçlü ve gelişime açık yönlerini güncelleyebilirsin."}
                                    </p>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={() => router.push("/interviews/start")}
                                            className="rounded-full bg-slate-950 px-6 py-3 font-bold text-white shadow transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                        >
                                            Bu Alanda Pratik Yap
                                        </button>

                                        <button
                                            onClick={() => router.push("/interviews/sessions")}
                                            className="rounded-full bg-white/90 px-6 py-3 font-bold text-slate-800 shadow transition hover:scale-105 hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                        >
                                            Geçmiş Oturumları İncele
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-950/40">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Mini Çalışma Planı
                                    </p>

                                    <div className="mt-5 space-y-4">
                                        {[
                                            {
                                                number: "1",
                                                title: "Konuyu tekrar et",
                                                text: `${dashboard.weakestCategory || "Zayıf olduğun alan"} alanındaki temel kavramları 10 dakika gözden geçir.`,
                                                color: "bg-rose-500",
                                            },
                                            {
                                                number: "2",
                                                title: "Örnek cevap hazırla",
                                                text: "Bu alanla ilgili 2 kısa mülakat cevabı yaz ve cevaplarını örnekle güçlendir.",
                                                color: "bg-violet-500",
                                            },
                                            {
                                                number: "3",
                                                title: "Sesli pratik yap",
                                                text: "Cevabını 2 dakika içinde net, sakin ve yapılandırılmış şekilde anlatmaya çalış.",
                                                color: "bg-sky-500",
                                            },
                                        ].map((step) => (
                                            <div
                                                key={step.number}
                                                className="flex gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"
                                            >
                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.color} text-xs font-black text-white`}>
                                                    {step.number}
                                                </span>

                                                <div>
                                                    <p className="font-black text-slate-950 dark:text-white">
                                                        {step.title}
                                                    </p>

                                                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                        {step.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                            <motion.div
                                variants={fadeUp}
                                whileHover={{ y: -4, scale: 1.01 }}
                                transition={{ duration: 0.25 }}
                                className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                            >
                                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
                                <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-500/10" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                                AI Performans Çekirdeği
                                            </p>

                                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                                Hazırlık enerjin
                                            </h2>

                                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                Ortalama skorun, tamamlama oranın ve odak alanın tek bir koç panelinde özetlenir.
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                            Pulse
                                        </span>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-[0.9fr_1.1fr]">
                                        <div className="flex items-center justify-center">
                                            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-violet-200 bg-white/70 shadow-inner dark:border-violet-400/20 dark:bg-slate-950/40">
                                                <div className="absolute h-44 w-44 rounded-full border border-pink-200 dark:border-pink-400/20" />
                                                <div className="absolute h-32 w-32 rounded-full border border-sky-200 dark:border-sky-400/20" />

                                                <div
                                                    className="absolute inset-5 rounded-full bg-gradient-to-tr from-pink-500 via-violet-500 to-sky-400 opacity-20 blur-xl"
                                                    style={{
                                                        transform: `scale(${0.65 + interviewReadiness / 250})`,
                                                    }}
                                                />

                                                <div className="relative z-10 text-center">
                                                    <p className="text-6xl font-black text-slate-950 dark:text-white">
                                                        {dashboard.averageScore ?? "-"}
                                                    </p>

                                                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                        skor
                                                    </p>
                                                </div>

                                                <div className="absolute left-4 top-8 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                                                    AI
                                                </div>

                                                <div className="absolute bottom-8 right-3 rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                                    Coach
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <PulseRow
                                                label="Mülakat hazırlığı"
                                                value={interviewReadiness}
                                                helper={`${dashboard.averageScore ?? 0}/100 ortalama skor`}
                                                tone="violet"
                                            />

                                            <PulseRow
                                                label="Pratik tamamlama"
                                                value={practiceCompletion}
                                                helper={`%${dashboard.completionRate ?? 0} tamamlama oranı`}
                                                tone="sky"
                                            />

                                            <div className="rounded-3xl border border-white/70 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/40">
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                    Bugünkü odak sinyali
                                                </p>

                                                <p className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                                                    {dashboard.weakestCategory || "Genel tekrar"}
                                                </p>

                                                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                    Bu alanda kısa bir pratik oturumu açarsan skor trendin daha hızlı yükselir.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={fadeUp}
                                whileHover={{ y: -4, scale: 1.01 }}
                                transition={{ duration: 0.25 }}
                                className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                            >
                                <div className="absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />

                                <div className="relative z-10 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                            Son Pratik Akışı
                                        </p>

                                        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                            Mülakat zaman çizgin
                                        </h2>

                                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            Son oturumların klasik grafik yerine AI lab kayıt akışı gibi gösterilir.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => router.push("/interviews/sessions")}
                                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:scale-105 dark:bg-white dark:text-slate-950"
                                    >
                                        Tümü
                                    </button>
                                </div>

                                <div className="relative z-10 mt-6 space-y-4">
                                    {dashboard.recentInterviews.length === 0 ? (
                                        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 text-center dark:border-slate-700 dark:bg-slate-950/40">
                                            <p className="font-bold text-slate-600 dark:text-slate-300">
                                                Henüz mülakat kaydı yok.
                                            </p>

                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                İlk pratiğini başlatınca akış burada oluşacak.
                                            </p>
                                        </div>
                                    ) : (
                                        dashboard.recentInterviews.slice(0, 4).map((interview, index) => {
                                            const score = Math.min(
                                                100,
                                                Math.max(0, Number(interview.totalScore ?? 0))
                                            );

                                            return (
                                                <div
                                                    key={`${interview.sessionId}-${index}`}
                                                    className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40"
                                                >
                                                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-pink-500 via-violet-500 to-sky-500 opacity-70" />

                                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="pl-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                                                    #{index + 1}
                                                                </span>

                                                                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow dark:bg-slate-800 dark:text-slate-200">
                                                                    {interview.status}
                                                                </span>
                                                            </div>

                                                            <p className="mt-3 font-black text-slate-950 dark:text-white">
                                                                {interview.positionName}
                                                            </p>

                                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                AI koç oturum kaydı
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="h-14 w-14 rounded-2xl bg-slate-950 p-1 dark:bg-white">
                                                                <div
                                                                    className="h-full rounded-xl bg-gradient-to-t from-pink-500 via-violet-500 to-sky-400"
                                                                    style={{
                                                                        opacity: score > 0 ? score / 100 : 0.25,
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="min-w-16 text-right">
                                                                <p className="text-2xl font-black text-slate-950 dark:text-white">
                                                                    {interview.totalScore ?? "-"}
                                                                </p>

                                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                                    skor
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </section>

                        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        Rol Haritası
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                        Pozisyon performans kartları
                                    </h2>
                                </div>

                                <span className="w-fit rounded-full bg-sky-100 px-4 py-2 text-sm font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                    Skill Map
                                </span>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {dashboard.positionSummaries.length === 0 ? (
                                    <div className="rounded-3xl border border-white/70 bg-white/70 p-6 text-center dark:border-slate-700 dark:bg-slate-950/40 md:col-span-2 xl:col-span-4">
                                        <p className="font-bold text-slate-600 dark:text-slate-300">
                                            Henüz pozisyon performansı oluşmadı.
                                        </p>
                                    </div>
                                ) : (
                                    dashboard.positionSummaries.slice(0, 4).map((position, index) => {
                                        const averageScore = Math.min(
                                            100,
                                            Math.max(0, Number(position.averageScore ?? 0))
                                        );

                                        return (
                                            <div
                                                key={position.positionName}
                                                className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950/40"
                                            >
                                                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-pink-300/40 to-violet-300/30 blur-2xl dark:from-pink-500/10 dark:to-violet-500/10" />

                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                                                            Role 0{index + 1}
                                                        </span>

                                                        <span className="text-xl font-black text-violet-600 dark:text-violet-300">
                                                            {position.averageScore ?? "-"}
                                                        </span>
                                                    </div>

                                                    <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                                                        {position.positionName}
                                                    </h3>

                                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                        {position.interviewCount} mülakat pratiği
                                                    </p>

                                                    <div className="mt-5 grid grid-cols-10 gap-1">
                                                        {Array.from({ length: 10 }).map((_, itemIndex) => {
                                                            const isActive =
                                                                itemIndex < Math.round(averageScore / 10);

                                                            return (
                                                                <div
                                                                    key={itemIndex}
                                                                    className={`h-8 rounded-full transition ${isActive
                                                                            ? "bg-gradient-to-t from-pink-500 via-violet-500 to-sky-400"
                                                                            : "bg-slate-200 dark:bg-slate-800"
                                                                        }`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                            {[
                                {
                                    title: "En Güçlü Alan",
                                    value: dashboard.strongestCategory || "Henüz veri yok",
                                    text: "Şu anda mülakat performansında en iyi göründüğün alan.",
                                    valueClass: "text-emerald-600 dark:text-emerald-300",
                                },
                                {
                                    title: "Gelişim Alanı",
                                    value: dashboard.weakestCategory || "Henüz veri yok",
                                    text: "Burada biraz daha pratik yapmak genel skorunu hızlıca yükseltebilir.",
                                    valueClass: "text-rose-500 dark:text-rose-300",
                                },
                                {
                                    title: "AI Koç Notu",
                                    value: "Her pratikten sonra güncellenir",
                                    text: "Güçlü yönlerin, gelişim alanların ve çalışma önerilerin otomatik olarak güncellenir.",
                                    valueClass: "text-violet-600 dark:text-violet-300",
                                },
                            ].map((item) => (
                                <motion.div
                                    key={item.title}
                                    variants={fadeUp}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    transition={{ duration: 0.25 }}
                                    className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-xl transition dark:border-slate-700 dark:bg-slate-900/70"
                                >
                                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-pink-300/40 to-violet-300/30 blur-2xl transition group-hover:scale-125 dark:from-pink-500/10 dark:to-violet-500/10" />

                                    <p className="relative z-10 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {item.title}
                                    </p>

                                    <p className={`relative z-10 mt-4 text-xl font-black ${item.valueClass}`}>
                                        {item.value}
                                    </p>

                                    <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {item.text}
                                    </p>
                                </motion.div>
                            ))}
                        </section>

                        <section className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                                        Mülakat Hazırlık Akışın
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Daha güçlü cevaplar için bu adımları takip edebilirsin.
                                    </p>
                                </div>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-slate-950 px-5 py-3 font-bold text-white transition hover:scale-105 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >
                                    Pratiğe Devam Et
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                {[
                                    {
                                        no: "01",
                                        title: "CV Yükle",
                                        text: "Sistem becerilerini anlayabilsin diye CV’ni ekle.",
                                        color: "text-rose-500",
                                    },
                                    {
                                        no: "02",
                                        title: "Becerileri Analiz Et",
                                        text: "Teknik beceriler ve eksik alanlar CV üzerinden belirlenir.",
                                        color: "text-violet-500",
                                    },
                                    {
                                        no: "03",
                                        title: "Mülakat Pratiği Yap",
                                        text: "Rol, CV, teknik, SQL veya kodlama odaklı sorular cevapla.",
                                        color: "text-sky-500",
                                    },
                                    {
                                        no: "04",
                                        title: "Cevaplarını Geliştir",
                                        text: "Skor, AI geri bildirimi ve daha güçlü cevap örnekleri al.",
                                        color: "text-emerald-500",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.no}
                                        className="rounded-2xl border border-white/70 bg-white/75 p-5 transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950/40"
                                    >
                                        <div className={`text-sm font-black ${item.color}`}>
                                            {item.no}
                                        </div>

                                        <h3 className="mt-3 font-black text-slate-950 dark:text-white">
                                            {item.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                            {item.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                                        Son Mülakatlar
                                    </h2>

                                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                                        Oturumlar
                                    </span>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {dashboard.recentInterviews.length === 0 ? (
                                        <div className="rounded-2xl border border-white/50 bg-white/70 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                                            Henüz mülakat oturumu bulunmuyor.
                                        </div>
                                    ) : (
                                        dashboard.recentInterviews.map((interview) => (
                                            <div
                                                key={interview.sessionId}
                                                className="rounded-2xl border border-white/50 bg-white/75 p-5 transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white">
                                                            {interview.positionName}
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                            Durum: {interview.status}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                                                        {interview.totalScore ?? "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                                        Pozisyon Özetleri
                                    </h2>

                                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                        Roller
                                    </span>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {dashboard.positionSummaries.length === 0 ? (
                                        <div className="rounded-2xl border border-white/50 bg-white/70 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                                            Henüz pozisyon özeti bulunmuyor.
                                        </div>
                                    ) : (
                                        dashboard.positionSummaries.map((position) => (
                                            <div
                                                key={position.positionName}
                                                className="rounded-2xl border border-white/50 bg-white/75 p-5 transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40"
                                            >
                                                <p className="font-black text-slate-800 dark:text-white">
                                                    {position.positionName}
                                                </p>

                                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                    Mülakat Sayısı: {position.interviewCount}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    Ortalama Skor: {position.averageScore ?? "-"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </motion.div>
        </main>
    );
}

function PulseRow({
    label,
    value,
    helper,
    tone,
}: {
    label: string;
    value: number;
    helper: string;
    tone: "violet" | "sky";
}) {
    const gradientClass =
        tone === "violet"
            ? "from-pink-500 via-violet-500 to-fuchsia-500"
            : "from-violet-500 via-sky-500 to-cyan-400";

    return (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/40">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-black text-slate-900 dark:text-white">
                        {label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {helper}
                    </p>
                </div>

                <span className="text-lg font-black text-slate-950 dark:text-white">
                    %{value}
                </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}