"use client";

import axios from "axios";
import { motion, type Variants } from "framer-motion";
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
    const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

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

    const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
        setUpdatingTaskId(taskId);
        setMessage("");

        try {
            const endpoint = isCompleted
                ? `/StudyPlan/tasks/${taskId}/uncomplete`
                : `/StudyPlan/tasks/${taskId}/complete`;

            const response = await api.post<ApiResponse<string>>(endpoint);

            if (response.data.success) {
                const refreshedPlan = await api.get<ApiResponse<StudyPlan>>(
                    "/StudyPlan/my-plan"
                );

                if (refreshedPlan.data.success) {
                    setStudyPlan(refreshedPlan.data.data);
                } else {
                    setMessage(refreshedPlan.data.message);
                }
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Görev durumu güncellenirken bir hata oluştu."
                );
            } else {
                setMessage("Görev durumu güncellenirken bir hata oluştu.");
            }
        } finally {
            setUpdatingTaskId(null);
        }
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
                staggerChildren: 0.12,
            },
        },
    };

    const strongAreas = studyPlan?.strongAreas ?? [];
    const weakAreas = studyPlan?.weakAreas ?? [];
    const technicalTopics = studyPlan?.technicalFocusTopics ?? [];
    const communicationTopics = studyPlan?.communicationFocusTopics ?? [];
    const practiceModes = studyPlan?.recommendedPracticeModes ?? [];
    const weeklyPlan = studyPlan?.weeklyPlan ?? [];

    const developmentProgress = studyPlan?.developmentProgress ?? 0;
    const completedTaskCount = studyPlan?.completedTaskCount ?? 0;
    const totalTaskCount = studyPlan?.totalTaskCount ?? 0;

    const levelName =
        developmentProgress >= 80
            ? "Interview Hero"
            : developmentProgress >= 45
                ? "Rising Candidate"
                : "Starter Path";

    const nextMission =
        weeklyPlan.find((item) => !item.isCompleted)?.task ||
        "Bu haftaki tüm görevleri tamamladın. Yeni mülakat pratiğiyle planını güncelleyebilirsin.";

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
                                rotan
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                AI koçun; güçlü yönlerini, gelişim alanlarını, teknik odaklarını
                                ve haftalık pratik görevlerini tek bir yol haritasına dönüştürür.
                                Bu sayfadaki ilerleme yüzdesi artık tamamladığın görevlere göre hesaplanır.
                            </p>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-7 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                                >
                                    Pratiğe Başla ✨
                                </button>

                                <button
                                    onClick={() => router.push("/interviews/sessions")}
                                    className="rounded-full border border-violet-200 bg-white/80 px-7 py-3 font-black text-violet-700 shadow-lg transition hover:scale-105 hover:bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/20"
                                >
                                    Geçmişi İncele
                                </button>
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
                            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/40" />

                            <div className="relative z-10 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Current Level
                                    </p>

                                    <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
                                        {levelName}
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        Tamamlanan görev: {completedTaskCount}/{totalTaskCount}
                                    </p>
                                </div>

                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 via-violet-500 to-sky-500 text-2xl shadow-xl shadow-violet-500/30">
                                    🚀
                                </div>
                            </div>

                            <div className="relative z-10 mt-6">
                                <div className="flex justify-between text-xs font-black text-slate-600 dark:text-slate-300">
                                    <span>Gerçek gelişim ilerlemesi</span>
                                    <span>{developmentProgress}%</span>
                                </div>

                                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-rose-400 via-violet-500 to-sky-500 transition-all"
                                        style={{ width: `${developmentProgress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="relative z-10 mt-6 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    Sıradaki görev
                                </p>

                                <p className="mt-2 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">
                                    {nextMission}
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
                        <NavButton label="Geçmiş Mülakatlar" onClick={() => router.push("/interviews/sessions")} />

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                            AI Gelişim Planım
                        </button>

                        <NavButton label="Ayarlar" onClick={() => router.push("/settings")} />

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </motion.nav>

                {message && (
                    <motion.div
                        variants={fadeUp}
                        className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-5 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70"
                    >
                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                            {message}
                        </p>
                    </motion.div>
                )}

                {studyPlan && (
                    <>
                        <motion.section
                            variants={fadeUp}
                            className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]"
                        >
                            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />

                                <p className="relative z-10 text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Genel Özet
                                </p>

                                <h2 className="relative z-10 mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                    AI koçunun genel değerlendirmesi
                                </h2>

                                <p className="relative z-10 mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                    {studyPlan.generalSummary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <MiniMetric
                                    title="Tamamlanan"
                                    value={completedTaskCount}
                                    text={`${totalTaskCount} görev içinden`}
                                    color="from-emerald-400 to-sky-500"
                                />

                                <MiniMetric
                                    title="Gelişim Alanı"
                                    value={weakAreas.length}
                                    text="odaklanılacak konu"
                                    color="from-rose-400 to-pink-500"
                                />

                                <MiniMetric
                                    title="Haftalık Görev"
                                    value={weeklyPlan.length}
                                    text="planlı çalışma"
                                    color="from-violet-400 to-sky-500"
                                />
                            </div>
                        </motion.section>

                        <motion.section
                            variants={staggerContainer}
                            className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
                        >
                            <InfoCard
                                title="Güçlü Alanların"
                                badge="Avantaj"
                                items={strongAreas}
                                emptyText="Henüz güçlü alan bulunamadı."
                                accent="emerald"
                            />

                            <InfoCard
                                title="Gelişim Alanların"
                                badge="Odak"
                                items={weakAreas}
                                emptyText="Henüz gelişim alanı bulunamadı."
                                accent="rose"
                            />
                        </motion.section>

                        <motion.section
                            variants={staggerContainer}
                            className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3"
                        >
                            <InfoCard
                                title="Önerilen Pratik Modları"
                                badge="Mod"
                                items={practiceModes}
                                emptyText="Henüz mod önerisi yok."
                                accent="violet"
                            />

                            <InfoCard
                                title="Teknik Odak Konuları"
                                badge="Teknik"
                                items={technicalTopics}
                                emptyText="Henüz teknik konu önerisi yok."
                                accent="sky"
                            />

                            <InfoCard
                                title="Cevap Verme Tarzı"
                                badge="İletişim"
                                items={communicationTopics}
                                emptyText="Henüz iletişim önerisi yok."
                                accent="pink"
                            />
                        </motion.section>

                        <motion.section
                            variants={fadeUp}
                            className="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        Haftalık Yol Haritası
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                        7 günlük mülakat gelişim rotan
                                    </h2>
                                </div>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                                >
                                    Rotaya Başla
                                </button>
                            </div>

                            <div className="relative mt-8">
                                <div className="absolute left-5 top-0 hidden h-full w-1 rounded-full bg-gradient-to-b from-pink-400 via-violet-400 to-sky-400 md:block" />

                                <div className="space-y-5">
                                    {weeklyPlan.length === 0 ? (
                                        <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                                            Henüz haftalık plan oluşmadı. Birkaç mülakat pratiği yaptıktan sonra rota daha dolu görünecek.
                                        </div>
                                    ) : (
                                        weeklyPlan.map((item, index) => (
                                            <motion.div
                                                key={`${item.id}-${item.day}-${index}`}
                                                variants={fadeUp}
                                                whileHover={{ x: 6, scale: 1.01 }}
                                                transition={{ duration: 0.25 }}
                                                className="relative md:pl-14"
                                            >
                                                <div
                                                    className={
                                                        item.isCompleted
                                                            ? "absolute left-0 top-5 hidden h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white shadow-xl md:flex"
                                                            : "absolute left-0 top-5 hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-xl dark:bg-white dark:text-slate-950 md:flex"
                                                    }
                                                >
                                                    {item.isCompleted ? "✓" : index + 1}
                                                </div>

                                                <div
                                                    className={
                                                        item.isCompleted
                                                            ? "group relative overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm transition dark:border-emerald-400/20 dark:bg-emerald-400/10"
                                                            : "group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm transition dark:border-slate-700 dark:bg-slate-950/45"
                                                    }
                                                >
                                                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-pink-300/35 to-violet-300/25 blur-2xl transition group-hover:scale-125 dark:from-pink-500/10 dark:to-violet-500/10" />

                                                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={
                                                                    item.isCompleted
                                                                        ? "rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                                                                        : "rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white dark:bg-white dark:text-slate-950"
                                                                }
                                                            >
                                                                {item.day}
                                                            </span>

                                                            {item.isCompleted && (
                                                                <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                                                    Tamamlandı
                                                                </span>
                                                            )}
                                                        </div>

                                                        <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                                            {item.practiceMode}
                                                        </span>
                                                    </div>

                                                    <h3 className="relative z-10 mt-4 text-lg font-black text-slate-950 dark:text-white">
                                                        {item.focus}
                                                    </h3>

                                                    <p className="relative z-10 mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                                        {item.task}
                                                    </p>

                                                    <button
                                                        onClick={() => handleToggleTask(item.id, item.isCompleted)}
                                                        disabled={updatingTaskId === item.id}
                                                        className={
                                                            item.isCompleted
                                                                ? "relative z-10 mt-4 rounded-full bg-emerald-100 px-5 py-2 text-sm font-black text-emerald-700 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-400/10 dark:text-emerald-300"
                                                                : "relative z-10 mt-4 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                                                        }
                                                    >
                                                        {updatingTaskId === item.id
                                                            ? "Güncelleniyor..."
                                                            : item.isCompleted
                                                                ? "Tamamlandı ✓ Geri Al"
                                                                : "Görevi Tamamla"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    </>
                )}
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

function MiniMetric({
    title,
    value,
    text,
    color,
}: {
    title: string;
    value: number;
    text: string;
    color: string;
}) {
    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
        >
            <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${color} opacity-30 blur-2xl`} />

            <p className="relative z-10 text-sm font-bold text-slate-500 dark:text-slate-400">
                {title}
            </p>

            <p className="relative z-10 mt-3 text-4xl font-black text-slate-950 dark:text-white">
                {value}
            </p>

            <p className="relative z-10 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {text}
            </p>
        </motion.div>
    );
}

function InfoCard({
    title,
    badge,
    items,
    emptyText,
    accent,
}: {
    title: string;
    badge: string;
    items: string[];
    emptyText: string;
    accent: "emerald" | "rose" | "violet" | "sky" | "pink";
}) {
    const accentClasses = {
        emerald: {
            badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
            dot: "bg-emerald-500",
            glow: "from-emerald-300/35 to-sky-300/25 dark:from-emerald-500/10 dark:to-sky-500/10",
        },
        rose: {
            badge: "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
            dot: "bg-rose-500",
            glow: "from-rose-300/35 to-pink-300/25 dark:from-rose-500/10 dark:to-pink-500/10",
        },
        violet: {
            badge: "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
            dot: "bg-violet-500",
            glow: "from-violet-300/35 to-fuchsia-300/25 dark:from-violet-500/10 dark:to-fuchsia-500/10",
        },
        sky: {
            badge: "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
            dot: "bg-sky-500",
            glow: "from-sky-300/35 to-cyan-300/25 dark:from-sky-500/10 dark:to-cyan-500/10",
        },
        pink: {
            badge: "bg-pink-100 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300",
            dot: "bg-pink-500",
            glow: "from-pink-300/35 to-rose-300/25 dark:from-pink-500/10 dark:to-rose-500/10",
        },
    };

    const classes = accentClasses[accent];

    return (
        <motion.div
            variants={{
                hidden: {
                    opacity: 0,
                    y: 24,
                },
                visible: {
                    opacity: 1,
                    y: 0,
                },
            }}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.25 }}
            className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-2xl transition dark:border-slate-700 dark:bg-slate-900/70"
        >
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${classes.glow} blur-2xl transition group-hover:scale-125`} />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-pink-400 via-violet-400 to-sky-400 opacity-0 transition group-hover:opacity-100" />

            <div className="relative z-10 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {title}
                </h2>

                <span className={`rounded-full px-3 py-1 text-xs font-black ${classes.badge}`}>
                    {badge}
                </span>
            </div>

            <div className="relative z-10 mt-5 space-y-3">
                {items.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                        {emptyText}
                    </p>
                ) : (
                    items.map((item, index) => (
                        <div
                            key={`${item}-${index}`}
                            className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300"
                        >
                            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${classes.dot}`} />
                            <span>{item}</span>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}