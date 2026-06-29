"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, LoginResponse } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setIsLoading(true);

    try {
      const response = await api.post<ApiResponse<LoginResponse>>(
        "/Auth/login",
        {
          email,
          password,
        }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        router.push("/dashboard");
      } else {
        setMessage(response.data.message);
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Giriş sırasında bir hata oluştu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800 text-center">
          Welcome Back
        </h1>

        <p className="text-slate-500 text-center mt-2">
          Login to continue your interview practice.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yaren@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              type="password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-700 disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">{message}</p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="font-medium text-slate-900 underline"
          >
            Register
          </button>
        </p>
      </div>
    </main>
  );
}