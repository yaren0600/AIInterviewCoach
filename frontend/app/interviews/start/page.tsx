"use client";

import axios from "axios";
import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
    ApiResponse,
    Position,
    Resume,
    StartInterviewResponse,
} from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

const difficultyOptions = [
    { value: "Beginner", label: "Başlangıç", description: "Temel seviye sorular" },
    { value: "Intermediate", label: "Orta", description: "Mülakat seviyesine yakın" },
    { value: "Advanced", label: "İleri", description: "Daha zorlayıcı sorular" },
];

const interviewModes = [
    {
        value: "Role-Based",
        label: "Rol Odaklı",
        description: "Hedef pozisyona göre senaryo soruları",
    },
    {
        value: "CV-Based",
        label: "CV Odaklı",
        description: "CV’ndeki proje ve becerilere göre",
    },
    {
        value: "Technical",
        label: "Teknik",
        description: "Teknik kavram ve proje bağlantısı",
    },
    {
        value: "Behavioral",
        label: "Davranışsal",
        description: "STAR tekniğine uygun sorular",
    },
    {
        value: "Mixed",
        label: "Karma",
        description: "Teknik, rol ve davranışsal karışık",
    },
    {
        value: "SQL Practice",
        label: "SQL Pratiği",
        description: "SQL sorgusu yazdıran sorular",
    },
    {
        value: "Coding Practice",
        label: "Kodlama Pratiği",
        description: "Seçilen dilde kod yazma soruları",
    },
];

export default function StartInterviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [positions, setPositions] = useState<Position[]>([]);
    const [resumes, setResumes] = useState<Resume[]>([]);

    const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
        null
    );
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    const [selectedQuestionCount, setSelectedQuestionCount] = useState(8);
    const [selectedDifficulty, setSelectedDifficulty] = useState("Intermediate");
    const [selectedInterviewMode, setSelectedInterviewMode] = useState("Mixed");
    const [selectedProgrammingLanguage, setSelectedProgrammingLanguage] =
        useState("C#");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadPageData() {
            try {
                const [positionsResponse, resumesResponse] = await Promise.all([
                    api.get<ApiResponse<Position[]>>("/Positions"),
                    api.get<ApiResponse<Resume[]>>("/Resumes/my-resumes"),
                ]);

                if (positionsResponse.data.success) {
                    setPositions(positionsResponse.data.data);
                } else {
                    setMessage(positionsResponse.data.message);
                }

                if (resumesResponse.data.success) {
                    const loadedResumes = resumesResponse.data.data;
                    setResumes(loadedResumes);

                    const resumeIdFromUrl = searchParams.get("resumeId");

                    if (resumeIdFromUrl) {
                        const parsedResumeId = Number(resumeIdFromUrl);

                        const resumeExists = loadedResumes.some(
                            (resume) => resume.id === parsedResumeId
                        );

                        if (resumeExists) {
                            setSelectedResumeId(parsedResumeId);
                            setMessage("Seçtiğin CV mülakat için hazırlandı.");
                        }
                    }
                } else {
                    setMessage(resumesResponse.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "Mülakat hazırlık verileri yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("Mülakat hazırlık verileri yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadPageData();
    }, [router, searchParams]);

    const selectedPosition = positions.find(
        (position) => position.id === selectedPositionId
    );

    const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);

    const selectedDifficultyLabel =
        difficultyOptions.find((item) => item.value === selectedDifficulty)?.label ??
        selectedDifficulty;

    const selectedModeLabel =
        interviewModes.find((item) => item.value === selectedInterviewMode)?.label ??
        selectedInterviewMode;

    const handleStartInterview = async () => {
        if (!selectedPositionId) {
            setMessage("Lütfen önce bir pozisyon seç.");
            return;
        }

        setIsStarting(true);
        setMessage("");

        try {
            const response = await api.post<ApiResponse<StartInterviewResponse>>(
                "/Interviews/start",
                {
                    positionId: selectedPositionId,
                    resumeId: selectedResumeId,
                    questionCount: selectedQuestionCount,
                    difficulty: selectedDifficulty,
                    interviewMode: selectedInterviewMode,
                    programmingLanguage:
                        selectedInterviewMode === "Coding Practice"
                            ? selectedProgrammingLanguage
                            : null,
                }
            );

            if (response.data.success) {
                const startedInterview = response.data.data;

                const sessionId =
                    startedInterview.sessionId ??
                    startedInterview.id ??
                    startedInterview.interviewSessionId ??
                    startedInterview.interviewId;

                if (!sessionId) {
                    setMessage("Mülakat başlatıldı ancak oturum bilgisi bulunamadı.");
                    return;
                }

                const normalizedInterviewSession = {
                    ...startedInterview,
                    sessionId: sessionId,
                };

                sessionStorage.setItem(
                    `interviewSession-${sessionId}`,
                    JSON.stringify(normalizedInterviewSession)
                );

                router.push(`/interviews/${sessionId}`);
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Mülakat başlatılırken bir hata oluştu."
                );
            } else {
                setMessage("Mülakat başlatılırken bir hata oluştu.");
            }
        } finally {
            setIsStarting(false);
        }
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
                        Mülakat ayarları yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Pozisyonların ve CV’lerin hazırlanıyor.
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
                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    Mülakat Kurulum Stüdyosu
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                Hedef rolün için
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    kişisel mülakat
                                </span>{" "}
                                oturumu oluştur
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Pozisyonunu, CV bağlamını, zorluk seviyesini ve mülakat modunu seç.
                                Gemini destekli AI koçun sana özel sorular hazırlasın; sen cevapla,
                                sistem analiz etsin.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <HeroMetric value={positions.length} label="pozisyon" />
                                <HeroMetric value={resumes.length} label="CV" />
                                <HeroMetric value={selectedQuestionCount} label="soru" />
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
                                Hazırlık Paneli
                            </h2>

                            <div className="relative z-10 mt-5 space-y-3">
                                <SummaryRow
                                    label="Pozisyon"
                                    value={selectedPosition?.name || "Henüz seçilmedi"}
                                />

                                <SummaryRow
                                    label="CV"
                                    value={selectedResume?.fileName || "CV yok"}
                                />

                                <SummaryRow label="Mod" value={selectedModeLabel} />

                                <SummaryRow
                                    label="Zorluk"
                                    value={`${selectedDifficultyLabel} • ${selectedQuestionCount} soru`}
                                />
                            </div>

                            <button
                                onClick={handleStartInterview}
                                disabled={isStarting}
                                className="shine-button relative z-10 mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isStarting
                                    ? "AI soruları hazırlanıyor..."
                                    : "Mülakatı Başlat ✨"}
                            </button>

                            {message && (
                                <p className="relative z-10 mt-4 rounded-2xl border border-rose-100 bg-rose-50/80 p-3 text-center text-sm font-semibold text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                                    {message}
                                </p>
                            )}
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

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                            Yeni Mülakat
                        </button>

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
                    className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]"
                >
                    <motion.div
                        variants={fadeUp}
                        className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                    >
                        <SectionTitle
                            eyebrow="Hedef Pozisyon"
                            title="Pratik yapmak istediğin rolü seç"
                            description="Seçtiğin pozisyon, Gemini’nin üreteceği mülakat sorularının ana bağlamını belirler."
                        />

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {positions.length === 0 ? (
                                <EmptyCard text="Henüz pozisyon bulunamadı." />
                            ) : (
                                positions.map((position) => {
                                    const isSelected = selectedPositionId === position.id;

                                    return (
                                        <SelectableCard
                                            key={position.id}
                                            title={position.name}
                                            description={position.description}
                                            badge={isSelected ? "Seçildi" : "Rol"}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedPositionId(position.id)}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    <div className="space-y-6">
                        <motion.div
                            variants={fadeUp}
                            className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                        >
                            <SectionTitle
                                eyebrow="CV Bağlamı"
                                title="CV seç"
                                description="CV seçersen sorular projelerine ve becerilerine göre daha kişisel oluşturulur."
                            />

                            <div className="mt-6 space-y-3">
                                <SelectableCard
                                    title="CV olmadan başla"
                                    description="Standart rol odaklı mülakat oluştur."
                                    badge={selectedResumeId === null ? "Seçildi" : "Opsiyonel"}
                                    isSelected={selectedResumeId === null}
                                    onClick={() => setSelectedResumeId(null)}
                                />

                                {resumes.map((resume) => {
                                    const isSelected = selectedResumeId === resume.id;

                                    return (
                                        <SelectableCard
                                            key={resume.id}
                                            title={resume.fileName}
                                            description="Bu CV’ye göre kişisel sorular üret."
                                            badge={isSelected ? "Seçildi" : "CV"}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedResumeId(resume.id)}
                                        />
                                    );
                                })}
                            </div>

                            {resumes.length === 0 && (
                                <button
                                    onClick={() => router.push("/resumes")}
                                    className="mt-5 w-full rounded-full border border-violet-200 bg-white/85 px-5 py-3 text-sm font-black text-violet-700 shadow-lg transition hover:scale-105 hover:bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/20"
                                >
                                    Önce CV yükle
                                </button>
                            )}
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70"
                        >
                            <SectionTitle
                                eyebrow="Oturum Ayarları"
                                title="Mülakatını özelleştir"
                                description="Soru sayısını, zorluk seviyesini ve mülakat modunu seç."
                            />

                            <OptionGroup title="Soru Sayısı">
                                <div className="grid grid-cols-4 gap-2">
                                    {[5, 8, 10, 15].map((count) => (
                                        <SmallOptionButton
                                            key={count}
                                            isSelected={selectedQuestionCount === count}
                                            onClick={() => setSelectedQuestionCount(count)}
                                        >
                                            {count}
                                        </SmallOptionButton>
                                    ))}
                                </div>
                            </OptionGroup>

                            <OptionGroup title="Zorluk Seviyesi">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {difficultyOptions.map((difficulty) => (
                                        <LargeOptionButton
                                            key={difficulty.value}
                                            title={difficulty.label}
                                            description={difficulty.description}
                                            isSelected={selectedDifficulty === difficulty.value}
                                            onClick={() => setSelectedDifficulty(difficulty.value)}
                                        />
                                    ))}
                                </div>
                            </OptionGroup>

                            <OptionGroup title="Mülakat Modu">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {interviewModes.map((mode) => (
                                        <LargeOptionButton
                                            key={mode.value}
                                            title={mode.label}
                                            description={mode.description}
                                            isSelected={selectedInterviewMode === mode.value}
                                            onClick={() => setSelectedInterviewMode(mode.value)}
                                        />
                                    ))}
                                </div>
                            </OptionGroup>

                            {selectedInterviewMode === "Coding Practice" && (
                                <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-400/20 dark:bg-sky-400/10">
                                    <p className="text-sm font-black text-sky-800 dark:text-sky-200">
                                        Programlama Dili
                                    </p>

                                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {["C#", "Python", "JavaScript"].map((language) => (
                                            <SmallOptionButton
                                                key={language}
                                                isSelected={
                                                    selectedProgrammingLanguage === language
                                                }
                                                onClick={() =>
                                                    setSelectedProgrammingLanguage(language)
                                                }
                                                variant="sky"
                                            >
                                                {language}
                                            </SmallOptionButton>
                                        ))}
                                    </div>

                                    <p className="mt-3 text-xs leading-5 text-sky-800 dark:text-sky-200">
                                        Kodlama pratiğinde sorular seçtiğin dile göre hazırlanır.
                                    </p>
                                </div>
                            )}
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

function SummaryRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">
                {value}
            </p>
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

            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
            </p>
        </div>
    );
}

function EmptyCard({ text }: { text: string }) {
    return (
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            {text}
        </div>
    );
}

function SelectableCard({
    title,
    description,
    badge,
    isSelected,
    onClick,
}: {
    title: string;
    description: string;
    badge: string;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={
                isSelected
                    ? "group relative overflow-hidden rounded-3xl border border-slate-950 bg-slate-950 p-5 text-left text-white shadow-xl transition hover:-translate-y-1 dark:border-white dark:bg-white dark:text-slate-950"
                    : "group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 text-left text-slate-800 transition hover:-translate-y-1 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
            }
        >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-pink-300/35 to-violet-300/25 blur-2xl transition group-hover:scale-125 dark:from-pink-500/10 dark:to-violet-500/10" />

            <div className="relative z-10 flex items-center justify-between gap-3">
                <p className="font-black">{title}</p>

                <span
                    className={
                        isSelected
                            ? "rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white dark:bg-slate-950/10 dark:text-slate-950"
                            : "rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
                    }
                >
                    {badge}
                </span>
            </div>

            <p
                className={
                    isSelected
                        ? "relative z-10 mt-3 text-sm leading-6 text-slate-200 dark:text-slate-700"
                        : "relative z-10 mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400"
                }
            >
                {description}
            </p>
        </button>
    );
}

function OptionGroup({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mt-6">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                {title}
            </p>

            <div className="mt-3">{children}</div>
        </div>
    );
}

function SmallOptionButton({
    children,
    isSelected,
    onClick,
    variant = "default",
}: {
    children: React.ReactNode;
    isSelected: boolean;
    onClick: () => void;
    variant?: "default" | "sky";
}) {
    const selectedClass =
        variant === "sky"
            ? "bg-sky-600 text-white shadow dark:bg-sky-300 dark:text-slate-950"
            : "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950";

    return (
        <button
            type="button"
            onClick={onClick}
            className={
                isSelected
                    ? `rounded-2xl px-4 py-3 text-sm font-black transition ${selectedClass}`
                    : "rounded-2xl bg-white/75 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
            }
        >
            {children}
        </button>
    );
}

function LargeOptionButton({
    title,
    description,
    isSelected,
    onClick,
}: {
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                isSelected
                    ? "rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm text-white shadow transition dark:bg-white dark:text-slate-950"
                    : "rounded-2xl bg-white/75 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
            }
        >
            <span className="block font-black">{title}</span>

            <span
                className={
                    isSelected
                        ? "mt-1 block text-xs leading-5 text-slate-200 dark:text-slate-700"
                        : "mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400"
                }
            >
                {description}
            </span>
        </button>
    );
}