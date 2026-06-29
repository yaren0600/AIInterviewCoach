//id klasörünün köşeli parantezli olma sebebi Next.js de dinamik route demek
//bu da cv idsi değiştiğinde hangi cv için işlem yapıldığını gösterir 

"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, ResumeAnalysis } from "@/types/api";

export default function ResumeAnalysisPage() {
    const router = useRouter();
    //URLden gelen id ile backendden o cvye ait analizi istedik
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
                        "An error occurred while loading resume analysis."
                    );
                } else {
                    setMessage("An error occurred while loading resume analysis.");
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
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading resume analysis...
                    </p>
                </div>
            </main>
        );
    }

    if (message) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center px-4">
                <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center animate-fade-up">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Analysis could not be loaded
                    </h2>

                    <p className="text-rose-600 mt-3">{message}</p>

                    <button
                        onClick={() => router.push("/resumes")}
                        className="mt-6 rounded-full bg-slate-900 text-white px-6 py-3 font-medium hover:scale-105 transition"
                    >
                        Back to resumes
                    </button>
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
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-sky-500 live-dot" />
                                Resume Analysis
                            </div>

                            <h1 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                Understand your resume
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    before the interview
                                </span>
                            </h1>

                            <p className="mt-4 text-slate-600 max-w-2xl text-sm md:text-base leading-7">
                                Review detected skills, missing areas, and suggested roles.
                                These insights will help personalize your interview practice.
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-white/70 border border-white/70 p-6 shadow-xl max-w-md w-full">
                            <p className="text-sm font-bold text-slate-700">
                                Analysis summary
                            </p>

                            <p className="mt-4 text-3xl font-black text-slate-900">
                                {analysis?.detectedSkills.length ?? 0}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                                detected technical skills
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="rounded-full bg-rose-100 text-rose-600 px-3 py-1 text-xs font-bold">
                                    Skills
                                </span>

                                <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold">
                                    Roles
                                </span>

                                <span className="rounded-full bg-sky-100 text-sky-600 px-3 py-1 text-xs font-bold">
                                    Recommendations
                                </span>
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
                            className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold"
                        >
                            Resumes
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
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

                {analysis && (
                    <>
                        <section className="glass-card rounded-3xl p-6 mt-8 animate-fade-up">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                File
                            </p>

                            <h2 className="mt-3 text-2xl font-black text-slate-900">
                                {analysis.fileName}
                            </h2>

                            <p className="mt-3 text-slate-600 leading-7">
                                {analysis.summary}
                            </p>
                        </section>

                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Detected Skills
                                    </h2>

                                    <span className="rounded-full bg-emerald-100 text-emerald-600 px-3 py-1 text-xs font-bold">
                                        Found
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {analysis.detectedSkills.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No technical skills detected.
                                        </p>
                                    ) : (
                                        analysis.detectedSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-bold"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Missing Skills
                                    </h2>

                                    <span className="rounded-full bg-rose-100 text-rose-600 px-3 py-1 text-xs font-bold">
                                        Improve
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {analysis.missingSkills.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No missing skills found.
                                        </p>
                                    ) : (
                                        analysis.missingSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-rose-100 text-rose-700 px-4 py-2 text-sm font-bold"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Suggested Roles
                                    </h2>

                                    <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold">
                                        Match
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {analysis.suggestedPositions.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No suggested roles found.
                                        </p>
                                    ) : (
                                        analysis.suggestedPositions.map((position) => (
                                            <span
                                                key={position}
                                                className="rounded-full bg-violet-100 text-violet-700 px-4 py-2 text-sm font-bold"
                                            >
                                                {position}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="glass-card rounded-3xl p-6 mt-6 animate-fade-up">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                        Next Step
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                                        Start a resume-based interview
                                    </h2>

                                    <p className="text-slate-600 mt-2 max-w-3xl">
                                        Use this resume to generate questions based on your detected
                                        skills and suggested roles.
                                    </p>
                                </div>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-3 font-semibold shadow hover:scale-105 transition"
                                >
                                    Start Interview Practice
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}