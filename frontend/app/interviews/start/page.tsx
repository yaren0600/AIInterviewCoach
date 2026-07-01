"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    ApiResponse,
    Position,
    Resume,
    StartInterviewResponse,
} from "@/types/api";

export default function StartInterviewPage() {
    const router = useRouter();

    const [positions, setPositions] = useState<Position[]>([]);
    const [resumes, setResumes] = useState<Resume[]>([]);

    const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
        null
    );
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

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
                    setResumes(resumesResponse.data.data);
                } else {
                    setMessage(resumesResponse.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "An error occurred while loading interview setup data."
                    );
                } else {
                    setMessage("An error occurred while loading interview setup data.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadPageData();
    }, [router]);

    const handleStartInterview = async () => {
        if (!selectedPositionId) {
            setMessage("Please select a position first.");
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
                }
            );

            if (response.data.success) {
                const startedInterview = response.data.data;

                console.log("Start interview response:", startedInterview);

                const sessionId = startedInterview.sessionId;

                if (!sessionId) {
                    setMessage("Interview started but session id could not be found.");
                    return;
                }

                router.push(`/interviews/${sessionId}`);
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "An error occurred while starting interview."
                );
            } else {
                setMessage("An error occurred while starting interview.");
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
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading interview setup...
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
                                <span className="w-2 h-2 rounded-full bg-rose-500 live-dot" />
                                Interview Setup
                            </div>

                            <h1 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                Create a practice session
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    for your target role
                                </span>
                            </h1>

                            <p className="mt-4 text-slate-600 max-w-2xl text-sm md:text-base leading-7">
                                Select a role and optionally attach a resume. Your interview
                                questions will be generated based on the selected position and
                                your resume content.
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-white/70 border border-white/70 p-6 shadow-xl">
                            <p className="text-sm font-bold text-slate-700">
                                Session creation flow
                            </p>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-black">
                                        1
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-800">Choose role</p>
                                        <p className="text-sm text-slate-500">
                                            Pick the position you want to practice for.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-black">
                                        2
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-800">Attach resume</p>
                                        <p className="text-sm text-slate-500">
                                            Use your uploaded resume for more personalized questions.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-black">
                                        3
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-800">
                                            Start practicing
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Answer questions and receive feedback.
                                        </p>
                                    </div>
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

                        <button className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold">
                            Start Interview
                        </button>

                        <button
                            onClick={() => router.push("/interviews/sessions")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
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

                <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 mt-8">
                    <div className="glass-card rounded-3xl p-6 animate-fade-up">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                            Target Position
                        </p>

                        <h2 className="mt-3 text-2xl font-black text-slate-900">
                            Choose the role you want to practice
                        </h2>

                        <p className="mt-2 text-sm text-slate-600 leading-6">
                            The selected position determines the main interview question
                            categories.
                        </p>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {positions.length === 0 ? (
                                <div className="rounded-3xl bg-white/70 border border-white/60 p-6 text-sm text-slate-500">
                                    No positions found.
                                </div>
                            ) : (
                                positions.map((position) => {
                                    const isSelected = selectedPositionId === position.id;

                                    return (
                                        <button
                                            key={position.id}
                                            onClick={() => setSelectedPositionId(position.id)}
                                            className={`text-left rounded-3xl border p-5 transition hover:-translate-y-1 ${isSelected
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                                    : "bg-white/75 text-slate-800 border-white/70"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-black">{position.name}</p>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${isSelected
                                                            ? "bg-white/15 text-white"
                                                            : "bg-violet-100 text-violet-600"
                                                        }`}
                                                >
                                                    {isSelected ? "Selected" : "Role"}
                                                </span>
                                            </div>

                                            <p
                                                className={`mt-3 text-sm leading-6 ${isSelected ? "text-slate-200" : "text-slate-500"
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
                        <div className="glass-card rounded-3xl p-6 animate-fade-up">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                Resume Context
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-900">
                                Attach a resume
                            </h2>

                            <p className="mt-2 text-sm text-slate-600 leading-6">
                                This is optional, but choosing a resume makes the interview more
                                personal.
                            </p>

                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => setSelectedResumeId(null)}
                                    className={`w-full text-left rounded-3xl border p-4 transition ${selectedResumeId === null
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white/75 text-slate-800 border-white/70"
                                        }`}
                                >
                                    <p className="font-bold">No resume</p>
                                    <p
                                        className={`text-sm mt-1 ${selectedResumeId === null
                                                ? "text-slate-200"
                                                : "text-slate-500"
                                            }`}
                                    >
                                        Start a standard role-based interview.
                                    </p>
                                </button>

                                {resumes.map((resume) => {
                                    const isSelected = selectedResumeId === resume.id;

                                    return (
                                        <button
                                            key={resume.id}
                                            onClick={() => setSelectedResumeId(resume.id)}
                                            className={`w-full text-left rounded-3xl border p-4 transition hover:-translate-y-1 ${isSelected
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                                    : "bg-white/75 text-slate-800 border-white/70"
                                                }`}
                                        >
                                            <p className="font-bold">{resume.fileName}</p>

                                            <p
                                                className={`text-sm mt-1 ${isSelected ? "text-slate-200" : "text-slate-500"
                                                    }`}
                                            >
                                                Use this resume for personalized questions.
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {resumes.length === 0 && (
                                <button
                                    onClick={() => router.push("/resumes")}
                                    className="mt-5 w-full rounded-full bg-white text-slate-700 px-5 py-3 text-sm font-semibold shadow hover:scale-105 transition"
                                >
                                    Upload a resume first
                                </button>
                            )}
                        </div>

                        <div className="glass-card rounded-3xl p-6 animate-fade-up">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                Ready
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-900">
                                Start your interview session
                            </h2>

                            <p className="mt-2 text-sm text-slate-600 leading-6">
                                Once you start, the system will create questions and open your
                                interview practice screen.
                            </p>

                            <button
                                onClick={handleStartInterview}
                                disabled={isStarting}
                                className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-3 font-semibold shadow hover:scale-105 disabled:opacity-60 transition"
                            >
                                {isStarting ? "Starting..." : "Start Interview"}
                            </button>

                            {message && (
                                <p className="mt-4 text-sm text-center text-rose-600">
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