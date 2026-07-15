"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, Resume } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

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
                        "CV’ler yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("CV’ler yüklenirken bir hata oluştu.");
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
            setMessage("Lütfen PDF veya DOCX formatında bir CV seç.");
            setSelectedFile(null);
            return;
        }

        setMessage("");
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage("Lütfen önce bir CV dosyası seç.");
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
                setMessage("CV başarıyla yüklendi ve işlendi.");
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "CV yüklenirken bir hata oluştu."
                );
            } else {
                setMessage("CV yüklenirken bir hata oluştu.");
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
        return new Date(dateValue).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
                <div className="rounded-3xl border border-white/70 bg-white/75 px-8 py-6 text-center shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-100">
                        CV’ler yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Yüklediğin dosyalar hazırlanıyor.
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
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                                    CV Çalışma Alanı
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                CV’ni yükle ve
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    hedefli mülakat pratiğini
                                </span>{" "}
                                başlat
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                PDF veya DOCX formatındaki CV’ni ekle. Sistem CV metnini çıkarır,
                                teknik becerilerini analiz eder ve mülakat sorularını daha kişisel
                                hale getirir.
                            </p>
                        </div>

                        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-950/40 md:p-6">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                CV işleme akışı
                            </p>

                            <div className="mt-5 space-y-4">
                                {[
                                    {
                                        no: "1",
                                        title: "Dosya yükle",
                                        text: "PDF ve DOCX formatları desteklenir.",
                                        color: "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
                                    },
                                    {
                                        no: "2",
                                        title: "Metin çıkarılır",
                                        text: "CV içeriği analiz edilebilir metne dönüştürülür.",
                                        color: "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
                                    },
                                    {
                                        no: "3",
                                        title: "Mülakat kişiselleşir",
                                        text: "Becerilerin CV odaklı sorularda kullanılır.",
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

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
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

                <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            CV Yükle
                        </p>

                        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                            Yeni bir CV ekle
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            PDF veya DOCX dosyası seç. Yükleme sonrası backend CV metnini çıkarır
                            ve beceri analizi için hazırlar.
                        </p>

                        <label className="mt-6 block cursor-pointer rounded-3xl border-2 border-dashed border-violet-200 bg-white/70 p-6 text-center transition hover:bg-white dark:border-violet-400/20 dark:bg-slate-950/40 dark:hover:bg-slate-800">
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                +
                            </div>

                            <p className="mt-4 font-black text-slate-800 dark:text-white">
                                CV dosyası seç
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                PDF veya DOCX, tercihen 5MB altında
                            </p>
                        </label>

                        {selectedFile && (
                            <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Seçilen dosya
                                </p>

                                <p className="mt-1 font-black text-slate-800 dark:text-white">
                                    {selectedFile.name}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="mt-5 w-full rounded-full bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            {isUploading ? "CV yükleniyor..." : "CV’yi Yükle ve İşle"}
                        </button>

                        {message && (
                            <p className="mt-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {message}
                            </p>
                        )}
                    </div>

                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    CV Kütüphanesi
                                </p>

                                <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                    Yüklediğin CV’ler
                                </h2>
                            </div>

                            <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                {resumes.length} dosya
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            {resumes.length === 0 ? (
                                <div className="rounded-3xl border border-white/60 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
                                    <p className="text-lg font-black text-slate-800 dark:text-white">
                                        Henüz CV yüklenmedi.
                                    </p>

                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        İlk CV’ni yükleyerek CV odaklı mülakat sorularını aktif hale getirebilirsin.
                                    </p>
                                </div>
                            ) : (
                                resumes.map((resume) => (
                                    <div
                                        key={resume.id}
                                        className="rounded-3xl border border-white/70 bg-white/75 p-5 transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <p className="font-black text-slate-950 dark:text-white">
                                                    {resume.fileName}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    Yüklenme tarihi: {formatDate(resume.uploadedAt)}
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                                                        {resume.contentType.includes("pdf")
                                                            ? "PDF"
                                                            : "DOCX"}
                                                    </span>

                                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                                                        Metin çıkarıldı
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <button
                                                    onClick={() =>
                                                        router.push(`/resumes/${resume.id}/analysis`)
                                                    }
                                                    className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                                >
                                                    Analizi Gör
                                                </button>

                                                <button
                                                    onClick={() => router.push("/interviews/start")}
                                                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow transition hover:scale-105 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    Mülakatta Kullan
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