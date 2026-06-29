"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, Resume } from "@/types/api";

export default function ResumesPage() {
    const router = useRouter();

    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadResumes() {
            try {
                const response = await api.get<ApiResponse<Resume[]>>(
                    "/Resumes/my-resumes"
                );

                if (response.data.success) {
                    setResumes(response.data.data);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "An error occurred while loading resumes."
                    );
                } else {
                    setMessage("An error occurred while loading resumes.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadResumes();
    }, [router]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(file.type)) {
            setMessage("Please select a PDF or DOCX file.");
            setSelectedFile(null);
            return;
        }

        setMessage("");
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage("Please select a resume file first.");
            return;
        }

        setIsUploading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await api.post<ApiResponse<Resume>>(
                "/Resumes/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                setResumes((currentResumes) => [
                    response.data.data,
                    ...currentResumes,
                ]);

                setSelectedFile(null);
                setMessage("Resume uploaded and processed successfully.");
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "An error occurred while uploading resume."
                );
            } else {
                setMessage("An error occurred while uploading resume.");
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const formatDate = (dateValue: string) => {
        return new Date(dateValue).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <main className="min-h-screen dashboard-gradient-bg flex items-center justify-center">
                <div className="glass-card rounded-3xl px-8 py-6 text-center animate-fade-up">
                    <p className="text-slate-700 text-lg font-medium">
                        Loading resumes...
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
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-violet-500 live-dot" />
                                Resume Workspace
                            </div>

                            <h1 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                Upload your resume and
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    unlock targeted practice
                                </span>
                            </h1>

                            <p className="mt-4 text-slate-600 max-w-2xl text-sm md:text-base leading-7">
                                Add your PDF or DOCX resume. The system extracts your text,
                                detects technical skills, and uses them to personalize your
                                interview questions.
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-white/65 border border-white/70 p-5 md:p-6 shadow-xl max-w-md w-full">
                            <p className="text-sm font-bold text-slate-700">
                                Resume processing flow
                            </p>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-black">
                                        1
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-800">Upload file</p>
                                        <p className="text-sm text-slate-500">
                                            PDF and DOCX formats are supported.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-black">
                                        2
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-800">Extract text</p>
                                        <p className="text-sm text-slate-500">
                                            Resume content is converted into analyzable text.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-black">
                                        3
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-800">
                                            Personalize interview
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Skills are used for resume-based questions.
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

                        <button className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold">
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

                <section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6 mt-8">
                    <div className="glass-card rounded-3xl p-6 animate-fade-up">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                            Upload Resume
                        </p>

                        <h2 className="mt-3 text-2xl font-black text-slate-900">
                            Add a new resume
                        </h2>

                        <p className="mt-2 text-sm text-slate-600 leading-6">
                            Choose a PDF or DOCX file. After upload, the backend will extract
                            text and prepare it for skill analysis.
                        </p>

                        <label className="mt-6 block rounded-3xl border-2 border-dashed border-violet-200 bg-white/70 p-6 text-center cursor-pointer hover:bg-white transition">
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl font-black">
                                +
                            </div>

                            <p className="mt-4 font-bold text-slate-800">
                                Select resume file
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                PDF or DOCX, recommended under 5MB
                            </p>
                        </label>

                        {selectedFile && (
                            <div className="mt-5 rounded-2xl bg-white/80 border border-white/70 p-4">
                                <p className="text-sm text-slate-500">Selected file</p>
                                <p className="font-bold text-slate-800 mt-1">
                                    {selectedFile.name}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="mt-5 w-full rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-700 disabled:opacity-60 transition"
                        >
                            {isUploading ? "Uploading..." : "Upload and process resume"}
                        </button>

                        {message && (
                            <p className="mt-4 text-sm text-center text-slate-700">
                                {message}
                            </p>
                        )}
                    </div>

                    <div className="glass-card rounded-3xl p-6 animate-fade-up">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                    Resume Library
                                </p>

                                <h2 className="mt-3 text-2xl font-black text-slate-900">
                                    Your uploaded resumes
                                </h2>
                            </div>

                            <span className="rounded-full bg-violet-100 text-violet-600 px-4 py-2 text-sm font-bold">
                                {resumes.length} file{resumes.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            {resumes.length === 0 ? (
                                <div className="rounded-3xl bg-white/70 border border-white/60 p-8 text-center">
                                    <p className="text-lg font-bold text-slate-800">
                                        No resumes uploaded yet.
                                    </p>

                                    <p className="text-sm text-slate-500 mt-2">
                                        Upload your first resume to unlock resume-based interview
                                        questions.
                                    </p>
                                </div>
                            ) : (
                                resumes.map((resume) => (
                                    <div
                                        key={resume.id}
                                        className="rounded-3xl bg-white/75 border border-white/70 p-5 hover:scale-[1.01] transition"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div>
                                                <p className="font-black text-slate-900">
                                                    {resume.fileName}
                                                </p>

                                                <p className="text-sm text-slate-500 mt-1">
                                                    Uploaded on {formatDate(resume.uploadedAt)}
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-sky-100 text-sky-600 px-3 py-1 text-xs font-bold">
                                                        {resume.contentType.includes("pdf")
                                                            ? "PDF"
                                                            : "DOCX"}
                                                    </span>

                                                    <span className="rounded-full bg-emerald-100 text-emerald-600 px-3 py-1 text-xs font-bold">
                                                        Text extracted
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={() =>
                                                        router.push(`/resumes/${resume.id}/analysis`)
                                                    }
                                                    className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold hover:bg-slate-700 transition"
                                                >
                                                    View Analysis
                                                </button>

                                                <button
                                                    onClick={() => router.push("/interviews/start")}
                                                    className="rounded-full bg-white text-slate-700 px-5 py-2 text-sm font-semibold shadow hover:scale-105 transition"
                                                >
                                                    Use in Interview
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}