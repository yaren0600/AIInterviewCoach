"use client";

import axios from "axios";
import { motion, type Variants } from "framer-motion";
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

    const fadeUp: Variants = {
        hidden: {
            opacity: 0,
            y: 24,
        },
        visible: {
            opacity: 1,
            y: 0,
        },
    };

    const staggerContainer: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.12,
            },
        },
    };

    const features = [
        {
            title: "Kişisel CV analizi",
            text: "CV’ndeki beceriler analiz edilir ve mülakat soruları buna göre hazırlanır.",
            icon: "📄",
            color: "from-rose-400 to-pink-500",
        },
        {
            title: "Rol odaklı pratik",
            text: "İş analisti, backend, veri analisti veya teknik roller için hedefli sorular üret.",
            icon: "🎯",
            color: "from-violet-400 to-fuchsia-500",
        },
        {
            title: "Gelişim takibi",
            text: "Geçmiş mülakatlarını, skorlarını ve haftalık AI planını düzenli takip et.",
            icon: "📈",
            color: "from-sky-400 to-cyan-500",
        },
    ];

    return (
        <main className="neon-lab-bg relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 dark:text-slate-100 md:px-6">
            <div className="lab-grid absolute inset-0" />
            <div className="lab-noise absolute inset-0" />
            <div className="lab-scanline" />
            <div className="lab-vignette absolute inset-0" />

            <motion.div
                animate={{
                    x: [0, 24, 0],
                    y: [0, -18, 0],
                    scale: [1, 1.08, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="neon-orb absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-pink-300/28 blur-[120px] dark:bg-pink-500/18"
            />

            <motion.div
                animate={{
                    x: [0, -28, 0],
                    y: [0, 20, 0],
                    scale: [1, 1.12, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="neon-orb-reverse absolute -right-24 top-16 h-[34rem] w-[34rem] rounded-full bg-violet-300/28 blur-[130px] dark:bg-violet-500/18"
            />

            <div className="absolute left-1/2 top-[42%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-300/16 blur-[150px] dark:bg-sky-500/12" />
            <div className="absolute bottom-0 left-[12%] h-80 w-80 rounded-full bg-cyan-300/18 blur-[120px] dark:bg-cyan-500/10" />
            <div className="absolute bottom-8 right-[10%] h-72 w-72 rounded-full bg-fuchsia-200/22 blur-[110px] dark:bg-fuchsia-500/12" />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]"
            >
                <motion.section
                    variants={fadeUp}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="hidden overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.72] p-8 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/55 lg:block"
                >
                    <div className="relative">
                        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
                        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-pink-400/20 blur-3xl" />

                        <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                            <span className="h-2 w-2 rounded-full bg-violet-500" />
                            AI Interview Coach
                        </div>

                        <h1 className="relative z-10 mt-6 text-4xl font-black leading-tight text-slate-950 dark:text-white xl:text-6xl">
                            Kendi
                            <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                {" "}
                                mülakat çalışma alanını
                            </span>{" "}
                            oluştur
                        </h1>

                        <p className="relative z-10 mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                            Hesabını oluştur, CV’ni yükle, hedef pozisyonunu seç ve AI destekli
                            mülakat pratiğine hemen başla. Cevapların analiz edilsin, gelişim
                            planın kişisel olarak oluşsun.
                        </p>

                        <div className="relative z-10 mt-8 grid gap-4">
                            {features.map((item) => (
                                <motion.div
                                    key={item.title}
                                    variants={fadeUp}
                                    whileHover={{ x: 6, scale: 1.01 }}
                                    transition={{ duration: 0.25 }}
                                    className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/40"
                                >
                                    <div
                                        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${item.color} opacity-25 blur-2xl transition group-hover:scale-125`}
                                    />

                                    <div className="relative z-10 flex gap-4">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-xl shadow-lg shadow-violet-500/20`}
                                        >
                                            {item.icon}
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
                                </motion.div>
                            ))}
                        </div>

                        <div className="relative z-10 mt-8 grid grid-cols-3 gap-3">
                            <MiniBadge value="CV" label="Analiz" />
                            <MiniBadge value="AI" label="Koçluk" />
                            <MiniBadge value="7 gün" label="Plan" />
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    variants={fadeUp}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="relative w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.76] p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl dark:border-violet-400/20 dark:bg-slate-950/60 md:p-8"
                >
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/25 blur-3xl" />
                    <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/40" />

                    <div className="relative z-10 flex items-start justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                                <span className="h-2 w-2 rounded-full bg-violet-500" />
                                Yeni hesap
                            </div>

                            <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white md:text-4xl">
                                Kayıt Ol
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                AI Interview Coach ile mülakat pratiklerine başlamak için hesabını oluştur.
                            </p>
                        </div>

                        <ThemeToggle />
                    </div>

                    <form onSubmit={handleRegister} className="relative z-10 mt-8 space-y-5">
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
                            className="shine-button w-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? "Hesap oluşturuluyor..." : "Kayıt Ol ✨"}
                        </button>
                    </form>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative z-10 mt-5 rounded-2xl border p-4 text-center ${isSuccess
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
                        </motion.div>
                    )}

                    <p className="relative z-10 mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Zaten hesabın var mı?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="font-black text-violet-700 underline underline-offset-4 transition hover:text-pink-600 dark:text-violet-300 dark:hover:text-pink-300"
                        >
                            Giriş Yap
                        </button>
                    </p>
                </motion.section>
            </motion.div>
        </main>
    );
}

function MiniBadge({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-4 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/40">
            <p className="text-xl font-black text-slate-950 dark:text-white">
                {value}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {label}
            </p>
        </div>
    );
}