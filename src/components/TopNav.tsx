"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clapperboard, ContactRound, GitCommit, Globe, Search, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv-shows", label: "TV Shows" },
  { href: "/live-tv", label: "Live TV" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [genres, setGenres] = useState<string[]>([]);
  const queryParam = searchParams.get("q") || "";
  const genreParam = searchParams.get("genre") || "all";
  const hasActiveFilters = Boolean(queryParam.trim()) || genreParam !== "all";

  const [searchOpen, setSearchOpen] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasActiveFilters) setSearchOpen(true);
  }, [hasActiveFilters]);

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (document.getElementById("topnav-search-toggle")?.contains(target)) return;
      const el = searchPanelRef.current;
      if (!el?.contains(target)) setSearchOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    const loadGenres = async () => {
      const response = await fetch("/api/genres");
      const data = (await response.json()) as { genres?: string[] };
      setGenres(data.genres || []);
    };
    void loadGenres();
  }, []);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const searchQuery = String(form.get("q") || "").trim();
    const selectedGenre = String(form.get("genre") || "all");
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedGenre && selectedGenre !== "all") params.set("genre", selectedGenre);
    const target = params.toString() ? `/?${params.toString()}` : "/";
    router.push(target);
    setSearchOpen(false);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-wide text-blue-400">
            <span className="rounded-md bg-blue-500/20 p-1.5 text-blue-300">
              <Clapperboard size={18} className="text-blue-400" />
            </span>
            <span>StreamFlix</span>
          </h1>
          <nav className="hidden items-center gap-5 text-sm text-zinc-300 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "text-white" : "hover:text-white"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="topnav-search-toggle"
              aria-expanded={searchOpen}
              aria-controls="topnav-search-panel"
              onClick={() => setSearchOpen((open) => !open)}
              className={`rounded-full border p-2 transition hover:border-white/40 hover:text-white ${
                searchOpen
                  ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                  : "border-white/15 text-zinc-300"
              }`}
              aria-label={searchOpen ? "Close search" : "Open search"}
            >
              <Search size={18} strokeWidth={2} />
            </button>
            <Link
              href="https://github.com/sonu-daryani"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 p-2 text-zinc-300 transition hover:border-white/40 hover:text-white"
              aria-label="GitHub"
            >
              <GitCommit size={16} />
            </Link>
            <Link
              href="https://www.linkedin.com/in/sonu-daryani-248a18202/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 p-2 text-zinc-300 transition hover:border-white/40 hover:text-white"
              aria-label="LinkedIn"
            >
              <ContactRound size={16} />
            </Link>
            <Link
              href="https://sonu-daryani-portfolio.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 p-2 text-zinc-300 transition hover:border-white/40 hover:text-white"
              aria-label="Portfolio"
            >
              <Globe size={16} />
            </Link>
            <Link
              href="/cms"
              className="ml-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-900/40 hover:bg-blue-500"
            >
              CMS
            </Link>
          </div>
        </div>

        {searchOpen ? (
          <div
            ref={searchPanelRef}
            id="topnav-search-panel"
            role="search"
            className="flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <form onSubmit={applyFilters} className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                name="q"
                key={`q-${queryParam}`}
                defaultValue={queryParam}
                placeholder="Search titles or description..."
                autoFocus
                className="w-full min-w-0 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 sm:max-w-sm"
              />
              <select
                name="genre"
                key={`g-${genreParam}`}
                defaultValue={genreParam}
                className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 sm:w-auto"
              >
                <option value="all">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/");
                    setSearchOpen(false);
                  }}
                  className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white"
                  aria-label="Close search"
                >
                  <X size={16} strokeWidth={2} aria-hidden />
                  Close
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
