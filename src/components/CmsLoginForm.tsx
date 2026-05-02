"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CmsLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/cms-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setError(payload.message || "Unable to login.");
      setIsLoading(false);
      return;
    }

    const nextPath = searchParams.get("next") || "/cms";
    router.replace(nextPath.startsWith("/") ? nextPath : "/cms");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">CMS Admin Login</h1>
        <p className="mb-6 text-sm text-zinc-400">Sign in to manage catalog entries.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            className="w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-blue-300">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
