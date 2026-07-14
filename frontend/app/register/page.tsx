"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse } from "@/types/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();

        setMessage("");
        setIsSuccess(false);
        setIsLoading(true);

        try {
            const response = await api.post<ApiResponse<string>>("/Auth/register", {
                name,
                email,
                password,
            });

            setMessage(response.data.message);
            setIsSuccess(response.data.success);

            if (response.data.success) {
                setTimeout(() => {
                    router.push("/login");
                }, 800);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const validationErrors = error.response?.data?.errors;

                if (validationErrors) {
                    const firstError = Object.values(validationErrors)[0] as string[];
                    setMessage(firstError[0]);
                } else {
                    setMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "Kayıt sırasında bir hata oluştu."
                    );
                }
            } else {
                setMessage("Kayıt sırasında bir hata oluştu.");
            }

            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 px-4 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-slate-100">
            <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute right-10 top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute bottom-10 left-1/4 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 lg:block">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-violet-500" />
                        AI Interview Coach
                    </div>

                    <h1 className="mt-6 text-4xl font-black leading-tight text-slate-950 dark:text-white xl:text-5xl">
                        Kendi
                        <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                            {" "}
                            mülakat çalışma alanını
                        </span>{" "}
                        oluştur
                    </h1>

                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Hesabını oluştur, CV’ni yükle, hedef pozisyonunu seç ve AI destekli
                        mülakat pratiğine hemen başla.
                    </p>

                    <div className="mt-8 grid gap-4">
                        {[
                            {
                                title: "Kişisel CV analizi",
                                text: "CV’ndeki beceriler analiz edilir ve mülakat soruları buna göre hazırlanır.",
                                color: "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
                            },
                            {
                                title: "Rol odaklı pratik",
                                text: "İş analisti, backend, veri analisti veya teknik roller için hedefli sorular.",
                                color: "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
                            },
                            {
                                title: "Gelişim takibi",
                                text: "Geçmiş mülakatlarını, skorlarını ve gelişim alanlarını düzenli takip et.",
                                color: "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="flex gap-4 rounded-3xl border border-white/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${item.color}`}
                                >
                                    ✓
                                </div>

                                <div>
                                    <p className="font-black text-slate-900 dark:text-white">
                                        {item.title}
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/75 md:p-8">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                Yeni hesap
                            </div>

                            <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
                                Kayıt Ol
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                AI Interview Coach ile mülakat pratiklerine başlamak için hesabını oluştur.
                            </p>
                        </div>

                        <ThemeToggle />
                    </div>

                    <form onSubmit={handleRegister} className="mt-8 space-y-5">
                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                                Ad Soyad
                            </label>

                            <input
                                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-500/20"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Ad Soyad"
                                autoComplete="name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                                E-posta
                            </label>

                            <input
                                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-500/20"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="mail@example.com"
                                type="email"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                                Şifre
                            </label>

                            <input
                                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-500/20"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••"
                                type="password"
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-full bg-slate-950 px-6 py-3 font-black text-white shadow transition hover:scale-105 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            {isLoading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
                        </button>
                    </form>

                    {message && (
                        <div
                            className={`mt-5 rounded-2xl border p-4 text-center ${isSuccess
                                    ? "border-emerald-100 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                                    : "border-rose-100 bg-rose-50/80 dark:border-rose-400/20 dark:bg-rose-400/10"
                                }`}
                        >
                            <p
                                className={`text-sm font-semibold ${isSuccess
                                        ? "text-emerald-600 dark:text-emerald-300"
                                        : "text-rose-600 dark:text-rose-300"
                                    }`}
                            >
                                {message}
                            </p>
                        </div>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Zaten hesabın var mı?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="font-black text-slate-950 underline underline-offset-4 dark:text-white"
                        >
                            Giriş Yap
                        </button>
                    </p>
                </section>
            </div>
        </main>
    );
}