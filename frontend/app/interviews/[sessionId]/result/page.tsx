"use client";

import { useParams, useRouter } from "next/navigation";

export default function InterviewResultPage() {
    const router = useRouter();
    const params = useParams();

    const sessionId = params.sessionId as string;

    return (
        <main className="min-h-screen dashboard-gradient-bg relative overflow-hidden px-4 md:px-6 py-8">
            <div className="absolute top-8 left-8 w-44 h-44 bg-pink-300/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-24 right-10 w-56 h-56 bg-violet-300/25 rounded-full blur-3xl animate-float-reverse" />
            <div className="absolute bottom-10 left-1/4 w-52 h-52 bg-cyan-300/25 rounded-full blur-3xl animate-soft-pulse" />

            <div className="max-w-5xl mx-auto relative z-10">
                <section className="interview-studio-card rounded-[2rem] p-8 md:p-10 animate-fade-up text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
                        Interview Completed
                    </div>

                    <h1 className="mt-6 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                        Your interview session
                        <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                            {" "}
                            is completed
                        </span>
                    </h1>

                    <p className="mt-4 text-slate-600 max-w-2xl mx-auto leading-7">
                        Session ID: <span className="font-bold">{sessionId}</span>
                    </p>

                    <p className="mt-2 text-slate-500 max-w-2xl mx-auto text-sm leading-6">
                        This page will show your total score, general evaluation, strong
                        areas, improvement areas, and study recommendations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
                        <div className="rounded-3xl bg-white/75 border border-white/70 p-5">
                            <p className="text-sm text-slate-500 font-semibold">
                                Total Score
                            </p>
                            <p className="text-4xl font-black text-slate-900 mt-3">Soon</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Will be loaded from backend result endpoint.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white/75 border border-white/70 p-5">
                            <p className="text-sm text-slate-500 font-semibold">
                                Strong Areas
                            </p>
                            <p className="text-4xl font-black text-emerald-600 mt-3">Soon</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Your best interview categories will appear here.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white/75 border border-white/70 p-5">
                            <p className="text-sm text-slate-500 font-semibold">
                                Improvement Areas
                            </p>
                            <p className="text-4xl font-black text-rose-500 mt-3">Soon</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Topics that need more practice will appear here.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 hover:scale-105 transition"
                        >
                            Back to dashboard
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white text-slate-700 px-6 py-3 font-semibold shadow hover:scale-105 transition"
                        >
                            Start new interview
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}