"use client";

import axios from "axios";
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

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
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
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 py-8 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-slate-100 md:px-6">
            <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute right-10 top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute bottom-10 left-1/4 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 md:p-8">
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.1fr_0.9fr]">
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
                                Pozisyonunu, CV bağlamını, zorluk seviyesini ve mülakat modunu
                                seç. Yapay zeka sana özel sorular oluştursun; sen cevapla,
                                sistem analiz etsin.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                Oturum oluşturma akışı
                            </p>

                            <div className="mt-5 space-y-4">
                                {[
                                    {
                                        no: "1",
                                        title: "Rolünü seç",
                                        text: "Pratik yapmak istediğin hedef pozisyonu belirle.",
                                        color: "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
                                    },
                                    {
                                        no: "2",
                                        title: "CV bağlamı ekle",
                                        text: "İstersen yüklediğin CV ile daha kişisel sorular oluştur.",
                                        color: "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
                                    },
                                    {
                                        no: "3",
                                        title: "AI pratiğini başlat",
                                        text: "Soruları cevapla, skorunu ve AI koç raporunu gör.",
                                        color: "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
                                    },
                                ].map((step) => (
                                    <div key={step.no} className="flex items-start gap-3">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${step.color}`}
                                        >
                                            {step.no}
                                        </div>

                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white">
                                                {step.title}
                                            </p>

                                            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                {step.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
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

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </nav>

                <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Hedef Pozisyon
                        </p>

                        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                            Pratik yapmak istediğin rolü seç
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Seçtiğin pozisyon, Gemini’nin üreteceği mülakat sorularının ana
                            bağlamını belirler.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {positions.length === 0 ? (
                                <div className="rounded-3xl border border-white/60 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                                    Henüz pozisyon bulunamadı.
                                </div>
                            ) : (
                                positions.map((position) => {
                                    const isSelected = selectedPositionId === position.id;

                                    return (
                                        <button
                                            key={position.id}
                                            onClick={() => setSelectedPositionId(position.id)}
                                            className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 ${isSelected
                                                    ? "border-slate-950 bg-slate-950 text-white shadow-xl dark:border-white dark:bg-white dark:text-slate-950"
                                                    : "border-white/70 bg-white/75 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-black">{position.name}</p>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-black ${isSelected
                                                            ? "bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950"
                                                            : "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
                                                        }`}
                                                >
                                                    {isSelected ? "Seçildi" : "Rol"}
                                                </span>
                                            </div>

                                            <p
                                                className={`mt-3 text-sm leading-6 ${isSelected
                                                        ? "text-slate-200 dark:text-slate-700"
                                                        : "text-slate-500 dark:text-slate-400"
                                                    }`}
                                            >
                                                {position.description}
                                            </p>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                CV Bağlamı
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                CV seç
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Zorunlu değil; ama CV seçersen sorular projelerine ve becerilerine
                                göre daha kişisel oluşturulur.
                            </p>

                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => setSelectedResumeId(null)}
                                    className={`w-full rounded-3xl border p-4 text-left transition ${selectedResumeId === null
                                            ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                                            : "border-white/70 bg-white/75 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <p className="font-black">CV olmadan başla</p>

                                    <p
                                        className={`mt-1 text-sm ${selectedResumeId === null
                                                ? "text-slate-200 dark:text-slate-700"
                                                : "text-slate-500 dark:text-slate-400"
                                            }`}
                                    >
                                        Standart rol odaklı mülakat oluştur.
                                    </p>
                                </button>

                                {resumes.map((resume) => {
                                    const isSelected = selectedResumeId === resume.id;

                                    return (
                                        <button
                                            key={resume.id}
                                            onClick={() => setSelectedResumeId(resume.id)}
                                            className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-1 ${isSelected
                                                    ? "border-slate-950 bg-slate-950 text-white shadow-xl dark:border-white dark:bg-white dark:text-slate-950"
                                                    : "border-white/70 bg-white/75 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <p className="font-black">{resume.fileName}</p>

                                            <p
                                                className={`mt-1 text-sm ${isSelected
                                                        ? "text-slate-200 dark:text-slate-700"
                                                        : "text-slate-500 dark:text-slate-400"
                                                    }`}
                                            >
                                                Bu CV’ye göre kişisel sorular üret.
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {resumes.length === 0 && (
                                <button
                                    onClick={() => router.push("/resumes")}
                                    className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow transition hover:scale-105 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    Önce CV yükle
                                </button>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Oturum Ayarları
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                Mülakatını özelleştir
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Soru sayısını, zorluk seviyesini ve mülakat modunu seç.
                            </p>

                            <div className="mt-6">
                                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                    Soru Sayısı
                                </p>

                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {[5, 8, 10, 15].map((count) => {
                                        const isSelected = selectedQuestionCount === count;

                                        return (
                                            <button
                                                key={count}
                                                onClick={() => setSelectedQuestionCount(count)}
                                                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${isSelected
                                                        ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950"
                                                        : "bg-white/75 text-slate-700 hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                {count}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6">
                                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                    Zorluk Seviyesi
                                </p>

                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {difficultyOptions.map((difficulty) => {
                                        const isSelected = selectedDifficulty === difficulty.value;

                                        return (
                                            <button
                                                key={difficulty.value}
                                                onClick={() => setSelectedDifficulty(difficulty.value)}
                                                className={`rounded-2xl px-4 py-3 text-left text-sm transition ${isSelected
                                                        ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950"
                                                        : "bg-white/75 text-slate-700 hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <span className="block font-black">
                                                    {difficulty.label}
                                                </span>

                                                <span
                                                    className={`mt-1 block text-xs ${isSelected
                                                            ? "text-slate-200 dark:text-slate-700"
                                                            : "text-slate-500 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {difficulty.description}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6">
                                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                    Mülakat Modu
                                </p>

                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {interviewModes.map((mode) => {
                                        const isSelected = selectedInterviewMode === mode.value;

                                        return (
                                            <button
                                                key={mode.value}
                                                onClick={() => setSelectedInterviewMode(mode.value)}
                                                className={`rounded-2xl px-4 py-3 text-left text-sm transition ${isSelected
                                                        ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950"
                                                        : "bg-white/75 text-slate-700 hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <span className="block font-black">
                                                    {mode.label}
                                                </span>

                                                <span
                                                    className={`mt-1 block text-xs leading-5 ${isSelected
                                                            ? "text-slate-200 dark:text-slate-700"
                                                            : "text-slate-500 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {mode.description}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedInterviewMode === "Coding Practice" && (
                                <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-400/20 dark:bg-sky-400/10">
                                    <p className="text-sm font-black text-sky-800 dark:text-sky-200">
                                        Programlama Dili
                                    </p>

                                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {["C#", "Python", "JavaScript"].map((language) => {
                                            const isSelected =
                                                selectedProgrammingLanguage === language;

                                            return (
                                                <button
                                                    key={language}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedProgrammingLanguage(language)
                                                    }
                                                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${isSelected
                                                            ? "bg-sky-600 text-white shadow dark:bg-sky-300 dark:text-slate-950"
                                                            : "bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                                        }`}
                                                >
                                                    {language}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-3 text-xs leading-5 text-sky-800 dark:text-sky-200">
                                        Kodlama pratiğinde sorular seçtiğin dile göre hazırlanır ve
                                        cevap ekranı kod yazmaya daha uygun görünür.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Hazır
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                AI mülakat oturumunu başlat
                            </h2>

                            <div className="mt-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/40">
                                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                    <div>
                                        <p className="font-black text-slate-500 dark:text-slate-400">
                                            Pozisyon
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                                            {selectedPosition?.name || "Henüz seçilmedi"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-black text-slate-500 dark:text-slate-400">
                                            CV
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                                            {selectedResume?.fileName || "CV yok"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-black text-slate-500 dark:text-slate-400">
                                            Mod
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                                            {selectedModeLabel}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-black text-slate-500 dark:text-slate-400">
                                            Zorluk / Soru
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                                            {selectedDifficultyLabel} • {selectedQuestionCount} soru
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleStartInterview}
                                disabled={isStarting}
                                className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-black text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isStarting
                                    ? "AI soruları hazırlanıyor..."
                                    : "Mülakatı Başlat"}
                            </button>

                            {message && (
                                <p className="mt-4 text-center text-sm font-semibold text-rose-600 dark:text-rose-300">
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}