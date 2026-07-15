"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [message, setMessage] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const canDeleteAccount =
        password.trim().length > 0 && confirmText.trim().toUpperCase() === "SİL";

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const handleDeleteAccount = async () => {
        if (!canDeleteAccount) {
            setMessage("Hesabını silmek için şifreni gir ve onay alanına SİL yaz.");
            return;
        }

        const isConfirmed = window.confirm(
            "Hesabını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz."
        );

        if (!isConfirmed) {
            return;
        }

        setIsDeleting(true);
        setMessage("");

        try {
            const response = await api.delete<ApiResponse<string>>(
                "/Auth/delete-account",
                {
                    data: {
                        password,
                    },
                }
            );

            if (response.data.success) {
                localStorage.removeItem("token");
                sessionStorage.clear();

                setMessage("Hesabın başarıyla silindi. Giriş sayfasına yönlendiriliyorsun.");

                setTimeout(() => {
                    router.push("/login");
                }, 1000);
            } else {
                setMessage(response.data.message);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Hesap silinirken bir hata oluştu."
                );
            } else {
                setMessage("Hesap silinirken bir hata oluştu.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 py-8 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-slate-100 md:px-6">
            <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute right-10 top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute bottom-10 left-1/4 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-10 mx-auto max-w-6xl">
                <header className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 md:p-8">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    Hesap Ayarları
                                </div>

                                <ThemeToggle />
                            </div>

                            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                                Hesabını ve
                                <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    {" "}
                                    kişisel verilerini
                                </span>{" "}
                                yönet
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                                Bu sayfadan hesabınla ilgili kritik işlemleri yapabilirsin.
                                Hesap silme işlemi geri alınamaz ve tüm CV, mülakat, soru-cevap
                                ve sonuç verilerini kalıcı olarak siler.
                            </p>
                        </div>

                        <div className="w-full max-w-md rounded-[2rem] border border-rose-100 bg-rose-50/80 p-6 shadow-xl dark:border-rose-400/20 dark:bg-rose-400/10">
                            <p className="text-sm font-black text-rose-700 dark:text-rose-300">
                                Dikkat
                            </p>

                            <p className="mt-3 text-sm leading-7 text-rose-900 dark:text-rose-100">
                                Hesabını sildiğinde yüklediğin CV’ler, mülakat geçmişin,
                                cevapların, skorların ve AI koç raporların tamamen silinir.
                            </p>
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

                        <button
                            onClick={() => router.push("/resumes")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            CV’lerim
                        </button>

                        <button
                            onClick={() => router.push("/interviews/start")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Yeni Mülakat
                        </button>

                        <button
                            onClick={() => router.push("/interviews/sessions")}
                            className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Geçmiş Mülakatlar
                        </button>

                        <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
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

                <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Hesap Bilgisi
                        </p>

                        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                            Aktif hesabın
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Giriş yaptığın hesap üzerinden CV yükleyebilir, mülakat pratiği
                            başlatabilir ve geçmiş sonuçlarını takip edebilirsin.
                        </p>

                        <div className="mt-6 rounded-3xl border border-white/70 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-950/40">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Veri Kapsamı
                            </p>

                            <div className="mt-4 space-y-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                <p>✓ CV dosyaları ve analizleri</p>
                                <p>✓ Mülakat oturumları</p>
                                <p>✓ Sorular ve cevaplar</p>
                                <p>✓ Skorlar ve AI geri bildirimleri</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-rose-400/20 dark:bg-slate-900/80">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500 dark:text-rose-300">
                            Tehlikeli Alan
                        </p>

                        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                            Hesabımı kalıcı olarak sil
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Bu işlem geri alınamaz. Hesabınla ilişkili tüm CV, mülakat,
                            cevap ve sonuç verileri silinir. Devam etmek için şifreni gir ve
                            onay alanına <span className="font-black text-rose-600 dark:text-rose-300">SİL</span> yaz.
                        </p>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                                    Şifren
                                </label>

                                <input
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    type="password"
                                    placeholder="••••••••"
                                    className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-rose-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                                    Onay metni
                                </label>

                                <input
                                    value={confirmText}
                                    onChange={(event) => setConfirmText(event.target.value)}
                                    placeholder="SİL"
                                    className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-rose-500/20"
                                />
                            </div>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || !canDeleteAccount}
                                className="w-full rounded-full bg-rose-600 px-6 py-3 font-black text-white shadow transition hover:scale-105 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? "Hesap siliniyor..." : "Hesabımı Kalıcı Olarak Sil"}
                            </button>
                        </div>

                        {message && (
                            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-center dark:border-rose-400/20 dark:bg-rose-400/10">
                                <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                                    {message}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}