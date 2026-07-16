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
    const [deletingResumeId, setDeletingResumeId] = useState<number | null>(null);

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
                    setResumes(response.data.data ?? []);
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

    const handleDeleteResume = async (resumeId: number) => {
        const isConfirmed = window.confirm(
            "Bu CV’yi silmek istediğine emin misin? Bu işlem geri alınamaz."
        );

        if (!isConfirmed) {
            return;
        }

        setDeletingResumeId(resumeId);
        setMessage("");

        try {
            const response = await api.delete<ApiResponse<string>>(
                `/Resumes/${resumeId}`
            );

            if (response.data.success) {
                setResumes((currentResumes) =>
                    currentResumes.filter((resume) => resume.id !== resumeId)
                );

                setMessage("CV başarıyla silindi.");
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "CV silinirken bir hata oluştu."
                );
            } else {
                setMessage("CV silinirken bir hata oluştu.");
            }
        } finally {
            setDeletingResumeId(null);
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
            <PageShell center>
                <div className="relative z-10 rounded-3xl border border-white/70 bg-white/[0.76] px-8 py-6 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-100">
                        CV’ler yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Yüklediğin dosyalar hazırlanıyor.
                    </p>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.72] p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/55 md:p-8">
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.1fr_0.9fr]">
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

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <HeroMetric value={resumes.length} label="yüklü CV" />
                                <HeroMetric value="PDF" label="desteklenen" />
                                <HeroMetric value="DOCX" label="desteklenen" />
                            </div>
                        </div>

                        <div className="float-card relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl dark:border-violet-400/25 dark:bg-slate-950/60 dark:shadow-violet-500/10">
                            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                            <p className="relative z-10 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                CV İşleme Akışı
                            </p>

                            <div className="relative z-10 mt-5 space-y-4">
                                <StepItem
                                    no="1"
                                    title="Dosya yükle"
                                    text="PDF ve DOCX formatları desteklenir."
                                    tone="rose"
                                />

                                <StepItem
                                    no="2"
                                    title="Metin çıkarılır"
                                    text="CV içeriği analiz edilebilir metne dönüştürülür."
                                    tone="violet"
                                />

                                <StepItem
                                    no="3"
                                    title="Mülakat kişiselleşir"
                                    text="Becerilerin CV odaklı sorularda kullanılır."
                                    tone="sky"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="mt-5 rounded-3xl border border-white/70 bg-white/65 px-4 py-3 shadow-xl shadow-violet-500/5 backdrop-blur-2xl dark:border-violet-400/15 dark:bg-slate-950/45">
                    <div className="flex flex-wrap gap-3">
                        <NavButton label="Dashboard" onClick={() => router.push("/dashboard")} />

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                            CV’lerim
                        </button>

                        <NavButton
                            label="Yeni Mülakat"
                            onClick={() => router.push("/interviews/start")}
                        />

                        <NavButton
                            label="Geçmiş Mülakatlar"
                            onClick={() => router.push("/interviews/sessions")}
                        />

                        <NavButton
                            label="AI Gelişim Planım"
                            onClick={() => router.push("/study-plan")}
                        />

                        <NavButton label="Ayarlar" onClick={() => router.push("/settings")} />

                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-white dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </nav>

                <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                        <SectionTitle
                            eyebrow="CV Yükle"
                            title="Yeni bir CV ekle"
                            description="PDF veya DOCX dosyası seç. Yükleme sonrası backend CV metnini çıkarır ve beceri analizi için hazırlar."
                        />

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

                                <p className="mt-1 break-words font-black text-slate-800 dark:text-white">
                                    {selectedFile.name}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="shine-button mt-5 w-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isUploading ? "CV yükleniyor..." : "CV’yi Yükle ve İşle"}
                        </button>

                        {message && (
                            <p className="mt-4 rounded-2xl border border-white/70 bg-white/70 p-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                                {message}
                            </p>
                        )}
                    </div>

                    <div className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <SectionTitle
                                eyebrow="CV Kütüphanesi"
                                title="Yüklediğin CV’ler"
                                description="CV analizlerini görebilir veya seçtiğin CV ile yeni mülakat başlatabilirsin."
                            />

                            <span className="w-fit rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                {resumes.length} dosya
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            {resumes.length === 0 ? (
                                <div className="rounded-3xl border border-white/60 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
                                    <p className="text-lg font-black text-slate-800 dark:text-white">
                                        Henüz CV yüklenmedi.
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        İlk CV’ni yükleyerek CV odaklı mülakat sorularını aktif hale getirebilirsin.
                                    </p>
                                </div>
                            ) : (
                                resumes.map((resume) => (
                                    <ResumeCard
                                        key={resume.id}
                                        resume={resume}
                                        formatDate={formatDate}
                                        deletingResumeId={deletingResumeId}
                                        onAnalyze={() =>
                                            router.push(`/resumes/${resume.id}/analysis`)
                                        }
                                        onUseInInterview={() =>
                                            router.push(`/interviews/start?resumeId=${resume.id}`)
                                        }
                                        onDelete={() => handleDeleteResume(resume.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </PageShell>
    );
}

function PageShell({
    children,
    center = false,
}: {
    children: React.ReactNode;
    center?: boolean;
}) {
    return (
        <main
            className={`neon-lab-bg relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 dark:text-slate-100 md:px-6 ${center ? "flex items-center justify-center" : ""
                }`}
        >
            <div className="lab-grid absolute inset-0" />
            <div className="lab-noise absolute inset-0" />
            <div className="lab-scanline" />
            <div className="lab-vignette absolute inset-0" />

            <div className="neon-orb absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-pink-300/28 blur-[120px] dark:bg-pink-500/18" />
            <div className="neon-orb-reverse absolute -right-24 top-16 h-[34rem] w-[34rem] rounded-full bg-violet-300/28 blur-[130px] dark:bg-violet-500/18" />
            <div className="absolute left-1/2 top-[38%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-300/16 blur-[150px] dark:bg-sky-500/12" />
            <div className="absolute bottom-0 left-[12%] h-80 w-80 rounded-full bg-cyan-300/18 blur-[120px] dark:bg-cyan-500/10" />
            <div className="absolute bottom-8 right-[10%] h-72 w-72 rounded-full bg-fuchsia-200/22 blur-[110px] dark:bg-fuchsia-500/12" />

            {children}
        </main>
    );
}

function NavButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
            {label}
        </button>
    );
}

function HeroMetric({
    value,
    label,
}: {
    value: string | number;
    label: string;
}) {
    return (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-4 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/40">
            <p className="text-2xl font-black text-slate-950 dark:text-white">
                {value}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {label}
            </p>
        </div>
    );
}

function SectionTitle({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {eyebrow}
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
            </p>
        </div>
    );
}

function StepItem({
    no,
    title,
    text,
    tone,
}: {
    no: string;
    title: string;
    text: string;
    tone: "rose" | "violet" | "sky";
}) {
    const toneClass =
        tone === "rose"
            ? "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
            : tone === "violet"
                ? "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
                : "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300";

    return (
        <div className="flex items-start gap-3">
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${toneClass}`}
            >
                {no}
            </div>

            <div>
                <p className="font-black text-slate-800 dark:text-white">
                    {title}
                </p>

                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {text}
                </p>
            </div>
        </div>
    );
}

function ResumeCard({
    resume,
    formatDate,
    deletingResumeId,
    onAnalyze,
    onUseInInterview,
    onDelete,
}: {
    resume: Resume;
    formatDate: (dateValue: string) => string;
    deletingResumeId: number | null;
    onAnalyze: () => void;
    onUseInInterview: () => void;
    onDelete: () => void;
}) {
    const isPdf = resume.contentType?.includes("pdf");

    return (
        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 transition hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-950/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="break-words font-black text-slate-950 dark:text-white">
                        {resume.fileName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Yüklenme tarihi: {formatDate(resume.uploadedAt)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                            {isPdf ? "PDF" : "DOCX"}
                        </span>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                            Metin çıkarıldı
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={onAnalyze}
                        className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        Analizi Gör
                    </button>

                    <button
                        onClick={onUseInInterview}
                        className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow transition hover:scale-105 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                        Mülakatta Kullan
                    </button>

                    <button
                        onClick={onDelete}
                        disabled={deletingResumeId === resume.id}
                        className="rounded-full bg-rose-50 px-5 py-2 text-sm font-bold text-rose-600 shadow transition hover:scale-105 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
                    >
                        {deletingResumeId === resume.id ? "Siliniyor..." : "Sil"}
                    </button>
                </div>
            </div>
        </div>
    );
}