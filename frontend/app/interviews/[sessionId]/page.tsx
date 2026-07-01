"use client";

import { useParams, useRouter } from "next/navigation";

export default function InterviewSessionPage() {
    const router = useRouter();
    const params = useParams();

    const sessionId = params.sessionId as string;

    return (
        <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center px-4">
            <div className="glass-card rounded-3xl p-8 max-w-xl w-full text-center animate-fade-up">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                    Interview Session
                </p>

                <h1 className="mt-4 text-3xl font-black text-slate-900">
                    Interview session started
                </h1>

                <p className="mt-4 text-slate-600">
                    Session ID: <span className="font-bold">{sessionId}</span>
                </p>

                <p className="mt-3 text-sm text-slate-500">
                    This page will display interview questions and answer submission flow.
                </p>

                <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-6 rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 transition"
                >
                    Back to dashboard
                </button>
            </div>
        </main>
    );
}