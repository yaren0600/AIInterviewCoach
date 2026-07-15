"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    ApiResponse,
    InterviewSessionSummary,
    RawInterviewSessionSummary,
} from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

type StatusFilter = "All" | "Completed" | "In Progress";

const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "All", label: "Tümü" },
    { value: "Completed", label: "Tamamlandı" },
    { value: "In Progress", label: "Devam Ediyor" },
];

export default function InterviewSessionsPage() {
    const router = useRouter();

    const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
    const [selectedStatusFilter, setSelectedStatusFilter] =
        useState<StatusFilter>("All");

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadSessions() {
            try {
                const response = await api.get<ApiResponse<RawInterviewSessionSummary[]>>(
                    "/Interviews/my-sessions"
                );

                if (response.data.success) {
                    const normalizedSessions = response.data.data
                        .map((session) => normalizeSessionSummary(session))
                        .filter((session) => session.sessionId !== 0);

                    setSessions(normalizedSessions);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "Mülakat geçmişi yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("Mülakat geçmişi yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadSessions();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const handleDeleteSession = async (sessionId: number) => {
        const isConfirmed = window.confirm(
            "Bu mülakat oturumunu silmek istediğine emin misin? Bu işlem geri alınamaz."
        );

        if (!isConfirmed) {
            return;
        }

        setDeletingSessionId(sessionId);
        setMessage("");

        try {
            const response = await api.delete<ApiResponse<string>>(
                `/Interviews/${sessionId}`
            );

            if (response.data.success) {
                setSessions((currentSessions) =>
                    currentSessions.filter((session) => session.sessionId !== sessionId)
                );

                setMessage("Mülakat oturumu başarıyla silindi.");
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Mülakat oturumu silinirken bir hata oluştu."
                );
            } else {
                setMessage("Mülakat oturumu silinirken bir hata oluştu.");
            }
        } finally {
            setDeletingSessionId(null);
        }
    };

    const formatDate = (dateValue: string | null) => {
        if (!dateValue) {
            return "Henüz tamamlanmadı";
        }

        return new Date(dateValue).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getStatusLabel = (status: string) => {
        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus.includes("completed")) {
            return "Tamamlandı";
        }

        if (normalizedStatus.includes("progress")) {
            return "Devam Ediyor";
        }

        return "Bilinmiyor";
    };

    const getStatusBadgeClass = (status: string) => {
        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus.includes("completed")) {
            return "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300";
        }

        if (normalizedStatus.includes("progress")) {
            return "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300";
        }

        return "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300";
    };

    const completedCount = sessions.filter((session) =>
        session.status.toLowerCase().includes("completed")
    ).length;

    const inProgressCount = sessions.filter((session) =>
        session.status.toLowerCase().includes("progress")
    ).length;

    const filteredSessions =
        selectedStatusFilter === "All"
            ? sessions
            : sessions.filter((session) => session.status === selectedStatusFilter);

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        Mülakat geçmişi yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Önceki oturumların hazırlanıyor.
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
                                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                                    Mülakat Geçmişi
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                Önceki
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    pratik oturumlarını
                                </span>{" "}
                                incele
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Tamamlanan mülakatlarını, skorlarını ve AI koç raporlarını buradan takip edebilirsin.
                                İstersen zayıf alanların için yeni bir pratik oturumu başlatabilirsin.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                Oturum Özeti
                            </p>

                            <p className="mt-4 text-5xl font-black text-slate-950 dark:text-white">
                                {sessions.length}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                toplam mülakat oturumu
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-white/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        Tamamlandı
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
                                        {completedCount}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        Devam Ediyor
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-300">
                                        {inProgressCount}
                                    </p>
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

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
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

                {message && (
                    <div className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-5 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                            {message}
                        </p>
                    </div>
                )}

                <section className="mt-8 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Oturumlar
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                Mülakat geçmişin
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Sonuçlarını inceleyebilir veya yeni bir pratik oturumu başlatabilirsin.
                            </p>
                        </div>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-black text-white shadow transition hover:scale-105"
                        >
                            Yeni Mülakat Başlat
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {statusFilters.map((status) => {
                            const isSelected = selectedStatusFilter === status.value;

                            return (
                                <button
                                    key={status.value}
                                    onClick={() => setSelectedStatusFilter(status.value)}
                                    className={`rounded-full px-5 py-2 text-sm font-black transition ${isSelected
                                            ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950"
                                            : "bg-white/75 text-slate-700 hover:bg-white dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    {status.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 space-y-4">
                        {filteredSessions.length === 0 ? (
                            <div className="rounded-3xl border border-white/70 bg-white/75 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
                                <p className="text-lg font-black text-slate-800 dark:text-white">
                                    Henüz bu filtreye uygun mülakat yok.
                                </p>

                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    İlk pratik oturumunu başlatınca geçmişin burada görünecek.
                                </p>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="mt-5 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >
                                    İlk Mülakatı Başlat
                                </button>
                            </div>
                        ) : (
                            filteredSessions.map((session) => (
                                <div
                                    key={session.sessionId}
                                    className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40"
                                >
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                                                    {session.positionName}
                                                </h3>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                                                        session.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(session.status)}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                                                <p>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        Başlangıç:
                                                    </span>{" "}
                                                    {formatDate(session.startedAt)}
                                                </p>

                                                <p>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        Tamamlanma:
                                                    </span>{" "}
                                                    {formatDate(session.completedAt)}
                                                </p>

                                                {session.resumeFileName && (
                                                    <p className="sm:col-span-2">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">
                                                            CV:
                                                        </span>{" "}
                                                        {session.resumeFileName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <div className="min-w-[120px] rounded-2xl bg-slate-950 px-5 py-4 text-center text-white dark:bg-white dark:text-slate-950">
                                                <p className="text-xs font-bold opacity-70">
                                                    Skor
                                                </p>

                                                <p className="mt-1 text-2xl font-black">
                                                    {session.totalScore ?? "-"}
                                                </p>
                                            </div>

                                            {session.status.toLowerCase().includes("completed") ? (
                                                <button
                                                    onClick={() => {
                                                        if (!session.sessionId) {
                                                            setMessage("Bu mülakat için oturum bilgisi bulunamadı.");
                                                            return;
                                                        }

                                                        router.push(`/interviews/${session.sessionId}/result`);
                                                    }}
                                                    className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow transition hover:scale-105 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    Sonucu Gör
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => router.push("/interviews/start")}
                                                    className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow transition hover:scale-105 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    Yeni Pratik Başlat
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDeleteSession(session.sessionId)}
                                                disabled={deletingSessionId === session.sessionId}
                                                className="rounded-full bg-rose-50 px-5 py-3 text-sm font-bold text-rose-600 shadow transition hover:scale-105 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
                                            >
                                                {deletingSessionId === session.sessionId ? "Siliniyor..." : "Sil"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

function normalizeSessionSummary(
    rawSession: RawInterviewSessionSummary
): InterviewSessionSummary {
    return {
        sessionId:
            rawSession.sessionId ??
            rawSession.id ??
            rawSession.interviewSessionId ??
            rawSession.interviewId ??
            0,
        positionName: rawSession.positionName ?? "Mülakat Oturumu",
        resumeFileName: rawSession.resumeFileName ?? null,
        startedAt:
            rawSession.startedAt ??
            rawSession.startDate ??
            rawSession.createdAt ??
            new Date().toISOString(),
        completedAt: rawSession.completedAt ?? rawSession.completedDate ?? null,
        totalScore: rawSession.totalScore ?? rawSession.score ?? null,
        status: rawSession.status ?? "Unknown",
    };
}