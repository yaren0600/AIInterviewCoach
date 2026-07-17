"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    ApiResponse,
    InterviewResult,
    InterviewResultQuestion,
    RewriteAnswerResponse,
} from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function InterviewResultPage() {
    const router = useRouter();
    const params = useParams();

    const sessionId = params.sessionId as string;

    const [result, setResult] = useState<InterviewResult | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [rewriteResults, setRewriteResults] = useState<
        Record<number, RewriteAnswerResponse>
    >({});

    const [rewriteErrors, setRewriteErrors] = useState<Record<number, string>>({});
    const [rewritingQuestionId, setRewritingQuestionId] = useState<number | null>(null);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        async function loadResult() {
            try {
                const response = await api.get<ApiResponse<InterviewResult>>(
                    `/Interviews/${sessionId}/result`
                );

                if (response.data.success) {
                    setResult(response.data.data);
                } else {
                    setMessage(response.data.message);
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "Mülakat sonucu yüklenirken bir hata oluştu."
                    );
                } else {
                    setMessage("Mülakat sonucu yüklenirken bir hata oluştu.");
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadResult();
    }, [router, sessionId]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const handleRewriteAnswer = async (question: InterviewResultQuestion) => {
        if (!result) {
            return;
        }

        if (!question.userAnswer || question.userAnswer.trim().length === 0) {
            setRewriteErrors((currentErrors) => ({
                ...currentErrors,
                [question.questionId]: "Bu soru için geliştirilecek bir cevap bulunmuyor.",
            }));

            return;
        }

        setRewritingQuestionId(question.questionId);

        setRewriteErrors((currentErrors) => {
            const updatedErrors = { ...currentErrors };
            delete updatedErrors[question.questionId];
            return updatedErrors;
        });

        try {
            const response = await api.post<ApiResponse<RewriteAnswerResponse>>(
                "/Interviews/rewrite-answer",
                {
                    questionText: question.questionText,
                    userAnswer: question.userAnswer,
                    positionName: result.positionName,
                    category: question.category,
                }
            );

            if (response.data.success) {
                setRewriteResults((currentResults) => ({
                    ...currentResults,
                    [question.questionId]: response.data.data,
                }));
            } else {
                setRewriteErrors((currentErrors) => ({
                    ...currentErrors,
                    [question.questionId]:
                        response.data.message || "Cevap yeniden yazılamadı.",
                }));
            }
        } catch (error: unknown) {
            let errorMessage = "Cevap yeniden yazılırken bir hata oluştu.";

            if (axios.isAxiosError(error)) {
                const responseMessage = error.response?.data?.message;

                if (typeof responseMessage === "string" && responseMessage.length > 0) {
                    errorMessage = responseMessage;
                } else if (error.message) {
                    errorMessage = error.message;
                }
            }

            setRewriteErrors((currentErrors) => ({
                ...currentErrors,
                [question.questionId]: errorMessage,
            }));
        } finally {
            setRewritingQuestionId(null);
        }
    };

    if (isLoading) {
        return (
            <PageShell center>
                <div className="relative z-10 rounded-3xl border border-white/70 bg-white/[0.76] px-8 py-6 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-100">
                        Mülakat sonucu yükleniyor...
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        AI koç raporun hazırlanıyor.
                    </p>
                </div>
            </PageShell>
        );
    }

    if (message) {
        return (
            <PageShell center>
                <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.76] p-8 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                    <h2 className="relative z-10 text-2xl font-black text-slate-950 dark:text-white">
                        Sonuç yüklenemedi
                    </h2>

                    <p className="relative z-10 mt-3 text-sm font-semibold leading-6 text-rose-600 dark:text-rose-300">
                        {message}
                    </p>

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="shine-button relative z-10 mt-6 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                    >
                        Dashboard’a dön
                    </button>
                </div>
            </PageShell>
        );
    }

    if (!result) {
        return (
            <PageShell center>
                <div className="relative z-10 rounded-3xl border border-white/70 bg-white/[0.76] p-8 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Yükleniyor
                    </p>

                    <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                        Sonuç bilgileri hazırlanıyor...
                    </h1>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Lütfen birkaç saniye bekle.
                    </p>
                </div>
            </PageShell>
        );
    }

    const strongAreas = result.strongAreas ?? [];
    const improvementAreas = result.improvementAreas ?? [];
    const studyRecommendations = result.studyRecommendations ?? [];
    const categoryPerformances = result.categoryPerformances ?? [];
    const questions = result.questions ?? [];

    const averageScore =
        result.averageScore ??
        (questions.length > 0
            ? Math.round(
                questions.reduce(
                    (total, question) => total + (question.score ?? 0),
                    0
                ) / questions.length
            )
            : null);

    const answeredQuestions =
        result.answeredQuestions ??
        questions.filter(
            (question) =>
                question.userAnswer && question.userAnswer.trim().length > 0
        ).length;

    const totalQuestions = result.totalQuestions ?? questions.length;

    const scoreForBar = Math.min(
        100,
        Math.max(0, Number(averageScore ?? result.totalScore ?? 0))
    );

    return (
        <PageShell>
            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.72] p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/55 md:p-8">
                    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[1.08fr_0.92fr]">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Mülakat Tamamlandı
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                AI mülakat sonucun
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    hazır
                                </span>
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Skorunu, güçlü yönlerini, gelişim alanlarını, soru bazlı AI koç
                                raporunu ve sonraki çalışma önerilerini buradan inceleyebilirsin.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <HeroMetric
                                    value={averageScore ?? result.totalScore ?? "-"}
                                    label="ortalama skor"
                                />

                                <HeroMetric
                                    value={answeredQuestions}
                                    label="cevaplanan soru"
                                />

                                <HeroMetric
                                    value={totalQuestions}
                                    label="toplam soru"
                                />
                            </div>
                        </div>

                        <div className="float-card relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl dark:border-violet-400/25 dark:bg-slate-950/60 dark:shadow-violet-500/10">
                            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/25 blur-3xl" />
                            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />

                            <p className="relative z-10 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Performans Özeti
                            </p>

                            <div className="relative z-10 mt-5 flex items-end gap-3">
                                <p className="text-6xl font-black text-slate-950 dark:text-white">
                                    {averageScore ?? result.totalScore ?? "-"}
                                </p>

                                <p className="mb-2 text-sm font-black text-slate-500 dark:text-slate-400">
                                    /100
                                </p>
                            </div>

                            <p className="relative z-10 mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Hedef pozisyon:{" "}
                                <span className="font-black text-violet-700 dark:text-violet-300">
                                    {result.positionName}
                                </span>
                            </p>

                            <div className="relative z-10 mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-violet-500 transition-all"
                                    style={{ width: `${scoreForBar}%` }}
                                />
                            </div>

                            <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
                                <MiniInfo label="Oturum" value={`#${result.sessionId}`} />

                                <MiniInfo
                                    label="Gelişim alanı"
                                    value={improvementAreas[0] ?? "Genel tekrar"}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <nav className="mt-5 rounded-3xl border border-white/70 bg-white/65 px-4 py-3 shadow-xl shadow-violet-500/5 backdrop-blur-2xl dark:border-violet-400/15 dark:bg-slate-950/45">
                    <div className="flex flex-wrap gap-3">
                        <NavButton label="Dashboard" onClick={() => router.push("/dashboard")} />
                        <NavButton label="CV’lerim" onClick={() => router.push("/resumes")} />
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

                <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <SectionTitle
                        eyebrow="Genel Değerlendirme"
                        title="AI koç genel yorumu"
                        description="Bu bölüm oturumdaki genel performansını kısa ve anlaşılır şekilde özetler."
                    />

                    <p className="mt-5 rounded-3xl border border-white/70 bg-white/70 p-5 text-sm leading-7 text-slate-700 shadow-inner dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                        {result.generalEvaluation || "Genel değerlendirme bulunamadı."}
                    </p>
                </section>

                <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <AreaCard
                        title="Güçlü Alanlar"
                        badge="Güçlü"
                        items={strongAreas}
                        emptyText="Henüz güçlü alan bulunamadı."
                        tone="emerald"
                    />

                    <AreaCard
                        title="Gelişim Alanları"
                        badge="Geliştir"
                        items={improvementAreas}
                        emptyText="Henüz gelişim alanı bulunamadı."
                        tone="rose"
                    />

                    <AreaCard
                        title="Çalışma Önerileri"
                        badge="Sonraki"
                        items={studyRecommendations}
                        emptyText="Henüz çalışma önerisi bulunamadı."
                        tone="violet"
                    />
                </section>

                <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <SectionTitle
                            eyebrow="Kişisel Çalışma Planı"
                            title="Sonuçlarına göre önerilen adımlar"
                            description="Geliştirmen gereken alanları küçük, uygulanabilir çalışma adımlarına böldük."
                        />

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                        >
                            Zayıf Alanlarda Tekrar Pratik Yap
                        </button>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        <PlanCard
                            eyebrow="Odak Alanı"
                            title={improvementAreas[0] ?? "Genel tekrar"}
                            text="Bugünkü ana odağın bu alan olsun. Önce temel kavramları tekrar et, sonra kısa örnek cevaplar hazırla."
                        />

                        <PlanCard
                            eyebrow="20 Dakikalık Görev"
                            title="Kısa tekrar yap"
                            text="Zayıf olduğun alandan 3 temel kavram seç. Her biri için bir tanım, kullanım amacı ve küçük bir örnek yaz."
                        />

                        <PlanCard
                            eyebrow="Pratik Yöntemi"
                            title="Sesli cevap pratiği"
                            text="Cevaplarını STAR veya tanım-amaç-örnek yapısıyla sesli anlat. Kısa, net ve örnekli cevap vermeye çalış."
                        />
                    </div>
                </section>

                <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <SectionTitle
                        eyebrow="Kategori Performansı"
                        title="Mülakat kategorilerine göre skor"
                        description="Hangi alanda daha güçlü olduğunu ve hangi alanı tekrar etmen gerektiğini buradan görebilirsin."
                    />

                    <div className="mt-6 space-y-4">
                        {categoryPerformances.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Henüz kategori performansı bulunamadı.
                            </p>
                        ) : (
                            categoryPerformances.map((category) => (
                                <div
                                    key={category.category}
                                    className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40"
                                >
                                    <div className="flex justify-between text-sm font-black text-slate-700 dark:text-slate-200">
                                        <span>{category.category}</span>
                                        <span>{category.averageScore}/100</span>
                                    </div>

                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    Math.max(0, category.averageScore)
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <SectionTitle
                        eyebrow="Soru Analizi"
                        title="Cevaplarının detaylı incelemesi"
                        description="Her soru için cevabını, skorunu, feedback’i, güçlü yönleri ve daha iyi cevap örneğini inceleyebilirsin."
                    />

                    <div className="mt-6 space-y-5">
                        {questions.length > 0 ? (
                            questions.map((question, index) => (
                                <QuestionAnalysisCard
                                    key={question.questionId}
                                    index={index}
                                    question={question}
                                    rewriteResult={rewriteResults[question.questionId]}
                                    rewriteError={rewriteErrors[question.questionId]}
                                    isRewriting={rewritingQuestionId === question.questionId}
                                    onRewrite={() => handleRewriteAnswer(question)}
                                />
                            ))
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60">
                                <p className="font-bold text-slate-700 dark:text-slate-300">
                                    Henüz soru-cevap detayı bulunamadı.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105"
                        >
                            Dashboard’a Dön
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full border border-violet-200 bg-white/85 px-6 py-3 font-black text-violet-700 shadow-lg transition hover:scale-105 hover:bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/20"
                        >
                            Yeni Mülakat Başlat
                        </button>
                    </div>

                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        Oturum ID: <span className="font-bold">{sessionId}</span>
                    </p>
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

function MiniInfo({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">
                {value}
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

function PlanCard({
    eyebrow,
    title,
    text,
}: {
    eyebrow: string;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {eyebrow}
            </p>

            <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                {title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {text}
            </p>
        </div>
    );
}

function AreaCard({
    title,
    badge,
    items,
    emptyText,
    tone,
}: {
    title: string;
    badge: string;
    items: string[];
    emptyText: string;
    tone: "emerald" | "rose" | "violet";
}) {
    const badgeClass =
        tone === "emerald"
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
            : tone === "rose"
                ? "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
                : "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300";

    return (
        <div className="rounded-[2rem] border border-white/70 bg-white/[0.75] p-6 shadow-xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {title}
                </h2>

                <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>
                    {badge}
                </span>
            </div>

            <div className="mt-5 space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {emptyText}
                    </p>
                ) : (
                    items.map((item, index) => (
                        <div
                            key={`${item}-${index}`}
                            className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm font-bold leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                        >
                            {item}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function QuestionAnalysisCard({
    index,
    question,
    rewriteResult,
    rewriteError,
    isRewriting,
    onRewrite,
}: {
    index: number;
    question: InterviewResultQuestion;
    rewriteResult?: RewriteAnswerResponse;
    rewriteError?: string;
    isRewriting: boolean;
    onRewrite: () => void;
}) {
    return (
        <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                            Soru {index + 1}
                        </span>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                            {question.category}
                        </span>

                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                            {question.difficulty}
                        </span>
                    </div>

                    <h3 className="mt-4 text-lg font-black leading-7 text-slate-950 dark:text-white">
                        {question.questionText}
                    </h3>
                </div>

                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-white dark:bg-white dark:text-slate-950">
                    <p className="text-xs font-bold opacity-70">Skor</p>
                    <p className="text-2xl font-black">{question.score ?? "-"}</p>
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Cevabın
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {question.userAnswer && question.userAnswer.trim().length > 0
                        ? question.userAnswer
                        : "Bu soru için cevap bulunmuyor."}
                </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            AI Answer Rewrite
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Cevabını daha profesyonel, net ve mülakata uygun hale getir.
                        </p>
                    </div>

                    <button
                        onClick={onRewrite}
                        disabled={isRewriting}
                        className="shine-button rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRewriting
                            ? "AI düzenliyor..."
                            : "AI ile Daha Güçlü Cevap Oluştur"}
                    </button>
                </div>

                {rewriteError && (
                    <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                        {rewriteError}
                    </p>
                )}

                {rewriteResult && (
                    <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                Geliştirilmiş Cevap
                            </p>

                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-emerald-950 dark:text-emerald-100">
                                {rewriteResult.rewrittenAnswer}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-400/20 dark:bg-sky-400/10">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                                AI Gelişim Notu
                            </p>

                            <p className="mt-3 text-sm leading-7 text-sky-950 dark:text-sky-100">
                                {rewriteResult.improvementNote}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {question.feedback && (
                <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-400/20 dark:bg-violet-400/10">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                        AI Geri Bildirim
                    </p>

                    <p className="mt-2 text-sm leading-7 text-violet-950 dark:text-violet-100">
                        {question.feedback}
                    </p>
                </div>
            )}

            {(question.strongPoints?.length > 0 ||
                question.improvementPoints?.length > 0) && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {question.strongPoints?.length > 0 && (
                            <PointList
                                title="Güçlü Yönler"
                                points={question.strongPoints}
                                tone="emerald"
                            />
                        )}

                        {question.improvementPoints?.length > 0 && (
                            <PointList
                                title="Gelişim Alanları"
                                points={question.improvementPoints}
                                tone="amber"
                            />
                        )}
                    </div>
                )}

            {question.betterAnswerExample && (
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/10">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                        Daha Güçlü Cevap Örneği
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-indigo-950 dark:text-indigo-100">
                        {question.betterAnswerExample}
                    </p>
                </div>
            )}
        </div>
    );
}

function PointList({
    title,
    points,
    tone,
}: {
    title: string;
    points: string[];
    tone: "emerald" | "amber";
}) {
    const wrapperClass =
        tone === "emerald"
            ? "border-emerald-100 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10"
            : "border-amber-100 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10";

    const textClass =
        tone === "emerald"
            ? "text-emerald-950 dark:text-emerald-100"
            : "text-amber-950 dark:text-amber-100";

    const titleClass =
        tone === "emerald"
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-amber-700 dark:text-amber-300";

    return (
        <div className={`rounded-2xl border p-4 ${wrapperClass}`}>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${titleClass}`}>
                {title}
            </p>

            <ul className={`mt-3 space-y-2 text-sm leading-6 ${textClass}`}>
                {points.map((point, index) => (
                    <li key={`${point}-${index}`} className="flex gap-2">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-current" />
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}