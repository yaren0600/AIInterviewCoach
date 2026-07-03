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
export default function InterviewSessionsPage() {
    const router = useRouter();

    const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

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
                    console.log("Raw sessions response:", response.data.data);

                    const normalizedSessions = response.data.data
                        .map((session) => normalizeSessionSummary(session))
                        .filter((session) => session.sessionId !== 0);

                    console.log("Normalized sessions:", normalizedSessions);

                    setSessions(normalizedSessions);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "An error occurred while loading interview sessions."
                    );
                } else {
                    setMessage("An error occurred while loading interview sessions.");
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

    const formatDate = (dateValue: string | null) => {
        if (!dateValue) {
            return "Not completed yet";
        }

        return new Date(dateValue).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadgeClass = (status: string) => {
        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus.includes("completed")) {
            return "bg-emerald-100 text-emerald-600";
        }

        if (normalizedStatus.includes("progress")) {
            return "bg-sky-100 text-sky-600";
        }

        return "bg-violet-100 text-violet-600";
    };

    if (isLoading) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading interview sessions...
                    </p>
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
                <header className="interview-studio-card rounded-[2rem] p-6 md:p-8 animate-fade-up">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-violet-500 live-dot" />
                                Interview History
                            </div>

                            <h1 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                Review your previous
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    practice sessions
                                </span>
                            </h1>

                            <p className="mt-4 text-slate-600 max-w-2xl text-sm md:text-base leading-7">
                                Track completed interviews, review scores, and return to past
                                results whenever you want to improve your preparation.
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-white/70 border border-white/70 p-6 shadow-xl">
                            <p className="text-sm font-bold text-slate-700">
                                Session summary
                            </p>

                            <p className="mt-4 text-5xl font-black text-slate-900">
                                {sessions.length}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                                total interview session{sessions.length === 1 ? "" : "s"}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white/75 border border-white/70 p-4">
                                    <p className="text-xs text-slate-500 font-semibold">
                                        Completed
                                    </p>

                                    <p className="text-2xl font-black text-emerald-600 mt-2">
                                        {
                                            sessions.filter((session) =>
                                                session.status.toLowerCase().includes("completed")
                                            ).length
                                        }
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/75 border border-white/70 p-4">
                                    <p className="text-xs text-slate-500 font-semibold">
                                        In Progress
                                    </p>

                                    <p className="text-2xl font-black text-sky-600 mt-2">
                                        {
                                            sessions.filter((session) =>
                                                session.status.toLowerCase().includes("progress")
                                            ).length
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="glass-card rounded-3xl px-4 py-3 mt-5 animate-fade-up">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={() => router.push("/resumes")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Resumes
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Start Interview
                        </button>

                        <button className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold">
                            My Sessions
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/70 text-rose-600 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                {message && (
                    <div className="glass-card rounded-3xl p-5 mt-6 text-center animate-fade-up">
                        <p className="text-rose-600 text-sm font-semibold">{message}</p>
                    </div>
                )}

                <section className="glass-card rounded-3xl p-6 mt-8 animate-fade-up">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                Sessions
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-900">
                                Your interview history
                            </h2>
                        </div>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-3 font-semibold shadow hover:scale-105 transition"
                        >
                            Start new interview
                        </button>
                    </div>

                    <div className="mt-6 space-y-4">
                        {sessions.length === 0 ? (
                            <div className="rounded-3xl bg-white/75 border border-white/70 p-8 text-center">
                                <p className="text-lg font-bold text-slate-800">
                                    No interview sessions yet.
                                </p>

                                <p className="text-sm text-slate-500 mt-2">
                                    Start your first practice session to see your history here.
                                </p>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="mt-5 rounded-full bg-slate-900 text-white px-6 py-3 text-sm font-semibold hover:bg-slate-700 transition"
                                >
                                    Start first interview
                                </button>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.sessionId}
                                    className="rounded-3xl bg-white/75 border border-white/70 p-5 hover:scale-[1.01] transition"
                                >
                                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-xl font-black text-slate-900">
                                                    {session.positionName}
                                                </h3>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                                                        session.status
                                                    )}`}
                                                >
                                                    {session.status}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-500 mt-2">
                                                Started: {formatDate(session.startedAt)}
                                            </p>

                                            <p className="text-sm text-slate-500 mt-1">
                                                Completed: {formatDate(session.completedAt)}
                                            </p>

                                            {session.resumeFileName && (
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Resume: {session.resumeFileName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="rounded-2xl bg-slate-900 text-white px-5 py-4 text-center min-w-[120px]">
                                                <p className="text-xs text-slate-300 font-semibold">
                                                    Score
                                                </p>

                                                <p className="text-2xl font-black mt-1">
                                                    {session.totalScore ?? "-"}
                                                </p>
                                            </div>

                                            {session.status.toLowerCase().includes("completed") ? (
                                                <button
                                                    onClick={() => {
                                                        if (!session.sessionId) {
                                                            setMessage("Session id could not be found for this interview.");
                                                            return;
                                                        }

                                                        router.push(`/interviews/${session.sessionId}/result`);
                                                    }}
                                                    className="rounded-full bg-white text-slate-700 px-5 py-3 text-sm font-semibold shadow hover:scale-105 transition"
                                                >
                                                    View Result
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => router.push("/interviews/start")}
                                                    className="rounded-full bg-white text-slate-700 px-5 py-3 text-sm font-semibold shadow hover:scale-105 transition"
                                                >
                                                    Start Another
                                                </button>
                                            )}
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
        positionName: rawSession.positionName ?? "Interview Session",
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