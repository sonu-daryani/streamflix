"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.08] bg-zinc-950/80 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">StreamFlix</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">
            A focused streaming experience—browse, search, and watch in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <Link href="/movies" className="transition hover:text-zinc-200">
            Movies
          </Link>
          <Link href="/tv-shows" className="transition hover:text-zinc-200">
            TV Shows
          </Link>
          <Link href="/live-tv" className="transition hover:text-zinc-200">
            Live TV
          </Link>
          <Link href="/cms" className="transition hover:text-zinc-200">
            CMS
          </Link>
        </div>
        <p className="text-xs text-zinc-600 md:text-right">Demo UI · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
