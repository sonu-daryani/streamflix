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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-zinc-900/90 p-8 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">CMS Admin</h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-400">
          Sign in to add titles, manage featured picks, and keep the catalog up to date.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cms-email" className="text-xs font-medium text-zinc-500">
              Email
            </label>
            <input
              id="cms-email"
              type="email"
              className="input-modern"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-password" className="text-xs font-medium text-zinc-500">
              Password
            </label>
            <input
              id="cms-password"
              type="password"
              className="input-modern"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-60">
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
