"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, DashboardResponse } from "@/types/api";

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
                        "An error occurred while loading dashboard data."
                    );
                } else {
                    setMessage("An error occurred while loading dashboard data.");
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

    if (isLoading) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading dashboard...
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
                        Something went wrong
                    </h2>

                    <p className="text-rose-600 mt-3">{message}</p>

                    <button
                        onClick={() => router.push("/login")}
                        className="mt-6 rounded-full bg-slate-900 text-white px-6 py-3 font-medium hover:scale-105 transition"
                    >
                        Back to login
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
            <div className="absolute bottom-16 right-16 w-40 h-40 bg-fuchsia-200/28 rounded-full blur-3xl animate-float-slow" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="interview-studio-card rounded-[2rem] p-6 md:p-8 animate-fade-up">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
                                Interview Prep Studio
                            </div>

                            <h1 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                Your personal space for
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    interview practice
                                </span>
                            </h1>

                            <p className="mt-4 text-slate-600 max-w-2xl text-sm md:text-base leading-7">
                                Turn your resume into targeted interview questions, practice
                                your answers, and see which topics need more work before the
                                real interview.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 hover:scale-105 transition"
                                >
                                    Start Interview Practice
                                </button>

                                <button
                                    onClick={() => router.push("/resumes")}
                                    className="rounded-full bg-white/85 text-slate-800 px-6 py-3 font-semibold shadow hover:scale-105 transition"
                                >
                                    Upload Resume
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="rounded-full border border-slate-300 bg-white/55 text-slate-700 px-6 py-3 font-semibold hover:bg-white transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[2rem] bg-white/55 border border-white/60 p-5 md:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-bold text-slate-700">
                                    Live practice preview
                                </p>

                                <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold">
                                    Active
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                                <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-xl min-h-[160px]">
                                    <p className="text-xs text-slate-300">Interviewer asks</p>

                                    <p className="mt-3 text-base font-semibold leading-7">
                                        “Tell me about your strongest backend project.”
                                    </p>

                                    <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                                        Role-based question
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-white p-5 shadow-xl border border-slate-100 min-h-[160px] floating-resume-card">
                                    <p className="text-xs font-bold text-violet-600">
                                        Resume insight
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-slate-800 leading-6">
                                        ASP.NET Core, SQL and REST API detected from your resume.
                                    </p>

                                    <div className="mt-4 flex gap-2 flex-wrap">
                                        <span className="rounded-full bg-rose-100 text-rose-600 px-3 py-1 text-xs font-semibold">
                                            Backend
                                        </span>

                                        <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-semibold">
                                            API
                                        </span>

                                        <span className="rounded-full bg-sky-100 text-sky-600 px-3 py-1 text-xs font-semibold">
                                            SQL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white/95 border border-slate-100 p-5 shadow-xl mt-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.16em]">
                                    Answer feedback
                                </p>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                                            <span>Technical clarity</span>
                                            <span>82%</span>
                                        </div>

                                        <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-rose-400 to-violet-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                                            <span>Example usage</span>
                                            <span>68%</span>
                                        </div>

                                        <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-400 to-sky-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="glass-card rounded-3xl px-4 py-3 mt-5 animate-fade-up">
                    <div className="flex flex-wrap gap-3">
                        <button className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold">
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

                        <button
                            onClick={() => router.push("/interviews/sessions")}
                            className="rounded-full bg-white/70 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-white transition"
                        >
                            My Sessions
                        </button>
                    </div>
                </nav>

                {dashboard && (
                    <>
                        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-8">
                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500 font-medium">
                                        Practice Sessions
                                    </p>

                                    <span className="rounded-full bg-rose-100 text-rose-600 px-3 py-1 text-xs font-bold">
                                        Sessions
                                    </span>
                                </div>

                                <p className="text-4xl font-black text-slate-900 mt-4">
                                    {dashboard.totalInterviews}
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Total practice sessions started
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500 font-medium">
                                        Completed Sessions
                                    </p>

                                    <span className="rounded-full bg-emerald-100 text-emerald-600 px-3 py-1 text-xs font-bold">
                                        Done
                                    </span>
                                </div>

                                <p className="text-4xl font-black text-slate-900 mt-4">
                                    {dashboard.completedInterviews}
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Sessions completed with feedback
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500 font-medium">
                                        Interview Readiness
                                    </p>

                                    <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold">
                                        Score
                                    </span>
                                </div>

                                <p className="text-4xl font-black text-slate-900 mt-4">
                                    {dashboard.averageScore ?? "-"}
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Average score from your answers
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500 font-medium">
                                        Practice Completion
                                    </p>

                                    <span className="rounded-full bg-sky-100 text-sky-600 px-3 py-1 text-xs font-bold">
                                        Progress
                                    </span>
                                </div>

                                <p className="text-4xl font-black text-slate-900 mt-4">
                                    {dashboard.completionRate}%
                                </p>

                                <p className="text-xs text-slate-500 mt-2">
                                    Progress across all sessions
                                </p>
                            </div>
                        </section>

                        <section className="glass-card rounded-[2rem] p-6 mt-6 animate-fade-up overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-300/25 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -left-10 w-44 h-44 bg-pink-300/20 rounded-full blur-3xl" />

                            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1fr_0.75fr] gap-6 items-stretch">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 live-dot" />
                                        Today&apos;s Focus
                                    </div>

                                    <h2 className="mt-5 text-3xl font-black text-slate-900">
                                        Bugünkü çalışma odağın:
                                        <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                            {" "}
                                            {dashboard.weakestCategory}
                                        </span>
                                    </h2>

                                    <p className="mt-4 text-slate-600 max-w-3xl text-sm md:text-base leading-7">
                                        {dashboard.latestRecommendation}
                                    </p>

                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={() => router.push("/interviews/start")}
                                            className="rounded-full bg-slate-900 text-white px-6 py-3 font-semibold shadow hover:bg-slate-700 hover:scale-105 transition"
                                        >
                                            Practice This Area
                                        </button>

                                        <button
                                            onClick={() => router.push("/interviews/sessions")}
                                            className="rounded-full bg-white/80 text-slate-800 px-6 py-3 font-semibold shadow hover:bg-white hover:scale-105 transition"
                                        >
                                            Review Past Sessions
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] bg-white/75 border border-white/70 p-5 shadow-xl">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                                        Mini Study Plan
                                    </p>

                                    <div className="mt-5 space-y-4">
                                        <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-black text-white">
                                                1
                                            </span>

                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    Konuyu tekrar et
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    {dashboard.weakestCategory} alanındaki temel kavramları 10 dakika gözden geçir.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-black text-white">
                                                2
                                            </span>

                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    Örnek cevap hazırla
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    Bu alanla ilgili 2 kısa mülakat cevabı yaz ve cevaplarını örnekle güçlendir.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">
                                                3
                                            </span>

                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    Sesli pratik yap
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    Cevabını 2 dakika içinde net, sakin ve yapılandırılmış şekilde anlatmaya çalış.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <p className="text-sm text-slate-500 font-medium">
                                    Strongest Category
                                </p>

                                <p className="mt-4 text-xl font-bold text-emerald-600">
                                    {dashboard.strongestCategory}
                                </p>

                                <p className="mt-2 text-sm text-slate-600">
                                    This is currently your strongest interview area.
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <p className="text-sm text-slate-500 font-medium">
                                    Weakest Category
                                </p>

                                <p className="mt-4 text-xl font-bold text-rose-500">
                                    {dashboard.weakestCategory}
                                </p>

                                <p className="mt-2 text-sm text-slate-600">
                                    A little more practice here can improve your overall
                                    performance.
                                </p>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up hover:-translate-y-1 transition">
                                <p className="text-sm text-slate-500 font-medium">
                                    Coaching Note
                                </p>

                                <p className="mt-4 text-sm leading-6 text-slate-700">
                                    After each practice session, your strengths, weak areas, and
                                    study recommendations are updated automatically.
                                </p>
                            </div>
                        </section>

                        <section className="glass-card rounded-3xl p-6 mt-6 animate-fade-up">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Your Interview Prep Flow
                                    </h2>

                                    <p className="text-slate-500 mt-1 text-sm">
                                        Follow these steps to improve your interview performance.
                                    </p>
                                </div>

                                <button
                                    onClick={() => router.push("/interviews/start")}
                                    className="rounded-full bg-slate-900 text-white px-5 py-3 font-medium hover:scale-105 transition"
                                >
                                    Continue Practice
                                </button>
                            </div>

                            <div className="hidden md:block h-3 flow-line mt-6" />

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                <div className="rounded-2xl bg-white/70 border border-white/60 p-5 hover:-translate-y-1 transition">
                                    <div className="text-sm font-black text-rose-500">01</div>

                                    <h3 className="font-bold text-slate-900 mt-3">
                                        Upload Resume
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-2">
                                        Add your CV so the system can understand your skills.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/70 border border-white/60 p-5 hover:-translate-y-1 transition">
                                    <div className="text-sm font-black text-violet-500">02</div>

                                    <h3 className="font-bold text-slate-900 mt-3">
                                        Analyze Skills
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-2">
                                        Detect technical skills and missing areas from your resume.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/70 border border-white/60 p-5 hover:-translate-y-1 transition">
                                    <div className="text-sm font-black text-sky-500">03</div>

                                    <h3 className="font-bold text-slate-900 mt-3">
                                        Practice Interview
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-2">
                                        Answer role-based and resume-based interview questions.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/70 border border-white/60 p-5 hover:-translate-y-1 transition">
                                    <div className="text-sm font-black text-emerald-500">04</div>

                                    <h3 className="font-bold text-slate-900 mt-3">
                                        Improve Answers
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-2">
                                        Get scores, feedback, and study recommendations.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Recent Interviews
                                    </h2>

                                    <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
                                        Sessions
                                    </span>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {dashboard.recentInterviews.length === 0 ? (
                                        <div className="rounded-2xl bg-white/70 border border-white/50 p-5 text-sm text-slate-500">
                                            No interview sessions yet.
                                        </div>
                                    ) : (
                                        dashboard.recentInterviews.map((interview) => (
                                            <div
                                                key={interview.sessionId}
                                                className="rounded-2xl bg-white/70 border border-white/50 p-5 hover:scale-[1.01] transition"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-bold text-slate-800">
                                                            {interview.positionName}
                                                        </p>

                                                        <p className="text-sm text-slate-500 mt-1">
                                                            Status: {interview.status}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-full bg-slate-900 text-white text-sm px-4 py-2 font-semibold">
                                                        {interview.totalScore ?? "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 animate-fade-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Position Summaries
                                    </h2>

                                    <span className="rounded-full bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold">
                                        Roles
                                    </span>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {dashboard.positionSummaries.length === 0 ? (
                                        <div className="rounded-2xl bg-white/70 border border-white/50 p-5 text-sm text-slate-500">
                                            No position summary yet.
                                        </div>
                                    ) : (
                                        dashboard.positionSummaries.map((position) => (
                                            <div
                                                key={position.positionName}
                                                className="rounded-2xl bg-white/70 border border-white/50 p-5 hover:scale-[1.01] transition"
                                            >
                                                <p className="font-bold text-slate-800">
                                                    {position.positionName}
                                                </p>

                                                <p className="text-sm text-slate-500 mt-2">
                                                    Interview Count: {position.interviewCount}
                                                </p>

                                                <p className="text-sm text-slate-500 mt-1">
                                                    Average Score: {position.averageScore ?? "-"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}