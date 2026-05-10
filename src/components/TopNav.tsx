"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Clapperboard,
  ContactRound,
  GitCommit,
  Globe,
  Menu,
  Search,
  X,
} from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasActiveFilters) setSearchOpen(true);
  }, [hasActiveFilters]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const locked = menuOpen || searchOpen;
    if (!locked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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

  const openMenu = () => {
    setSearchOpen(false);
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  const toggleSearch = () => {
    setMenuOpen(false);
    setSearchOpen((open) => !open);
  };

  return (
    <>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-[#e50914] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-xl focus:outline-none"
    >
      Skip to main content
    </a>
    <div className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-zinc-950/75 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:min-w-0 md:flex-none md:flex-initial">
            <button
              type="button"
              className="inline-flex shrink-0 rounded-full border border-white/12 bg-white/[0.04] p-2 text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white md:hidden"
              aria-expanded={menuOpen}
              aria-controls="topnav-mobile-drawer"
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
            </button>
            <Link
              href="/"
              className="group/logo flex min-w-0 items-center gap-2.5 text-xl font-black tracking-tight text-white sm:text-2xl"
              onClick={closeMenu}
            >
              <span className="flex rounded-xl bg-gradient-to-br from-red-600/30 to-zinc-900/40 p-2 ring-1 ring-white/10 transition group-hover/logo:ring-white/20">
                <Clapperboard size={18} className="text-rose-200" aria-hidden />
              </span>
              <span className="truncate bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                StreamFlix
              </span>
            </Link>
          </div>
          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1 text-sm text-zinc-400 shadow-inner shadow-black/20 md:flex" aria-label="Main">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 font-medium transition ${
                  pathname === item.href
                    ? "bg-white/12 text-white shadow-sm"
                    : "hover:bg-white/8 hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              id="topnav-search-toggle"
              aria-expanded={searchOpen}
              aria-controls="topnav-search-panel"
              onClick={toggleSearch}
              className={`rounded-full border p-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500/80 ${
                searchOpen
                  ? "border-red-500/55 bg-red-600/15 text-rose-100 shadow-[0_0_20px_rgba(229,9,20,0.28)]"
                  : "border-white/12 bg-white/[0.04] text-zinc-300 hover:border-white/25 hover:text-white"
              }`}
              aria-label={searchOpen ? "Close search" : "Open search"}
            >
              <Search size={18} strokeWidth={2} />
            </button>
            <span className="hidden items-center gap-1 sm:gap-2 md:flex">
              <Link
                href="https://github.com/sonu-daryani"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/22 hover:bg-white/[0.07] hover:text-white"
                aria-label="GitHub"
              >
                <GitCommit size={16} />
              </Link>
              <Link
                href="https://www.linkedin.com/in/sonu-daryani-248a18202/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/22 hover:bg-white/[0.07] hover:text-white"
                aria-label="LinkedIn"
              >
                <ContactRound size={16} />
              </Link>
              <Link
                href="https://sonu-daryani-portfolio.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/22 hover:bg-white/[0.07] hover:text-white"
                aria-label="Portfolio"
              >
                <Globe size={16} />
              </Link>
            </span>
            <Link
              href="/cms"
              className="btn-primary ml-0.5 px-3 py-2 text-xs sm:px-4 sm:text-sm"
              onClick={closeMenu}
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
            aria-label="Search and filter catalog"
            className="flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <form onSubmit={applyFilters} className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex w-full min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm">
                <label htmlFor="topnav-q" className="text-xs font-medium text-zinc-500">
                  Search
                </label>
                <input
                  id="topnav-q"
                  name="q"
                  key={`q-${queryParam}`}
                  defaultValue={queryParam}
                  placeholder="Titles, descriptions…"
                  autoFocus
                  className="input-modern"
                />
              </div>
              <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[11rem]">
                <label htmlFor="topnav-genre" className="text-xs font-medium text-zinc-500">
                  Genre
                </label>
                <select
                  id="topnav-genre"
                  name="genre"
                  key={`g-${genreParam}`}
                  defaultValue={genreParam}
                  className="input-modern"
                >
                  <option value="all">All genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 pb-0.5">
                <button type="submit" className="btn-primary px-5 py-2.5">
                  Apply filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/");
                    setSearchOpen(false);
                  }}
                  className="btn-secondary px-5 py-2.5"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="btn-ghost inline-flex items-center gap-1.5"
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

      {/* Must stay outside the blurred header: backdrop-filter traps fixed descendants */}
      <div
        className={`fixed inset-0 z-[90] md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 z-0 bg-black/75 transition-opacity ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
        />
        <aside
          id="topnav-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute left-0 top-0 z-[1] flex h-full w-[min(100%,20rem)] flex-col border-r border-white/[0.08] bg-zinc-950/98 shadow-[8px_0_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Menu</p>
            <button
              type="button"
              className="rounded-full border border-white/12 bg-white/[0.05] p-2 text-zinc-300 transition hover:border-white/25 hover:text-white"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Mobile main">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`rounded-xl px-3 py-3 text-base font-medium transition ${
                  pathname === item.href
                    ? "bg-white/12 text-white shadow-inner shadow-black/30"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/[0.08] px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">Links</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="https://github.com/sonu-daryani"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                onClick={closeMenu}
              >
                <GitCommit size={16} />
                GitHub
              </Link>
              <Link
                href="https://www.linkedin.com/in/sonu-daryani-248a18202/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                onClick={closeMenu}
              >
                <ContactRound size={16} />
                LinkedIn
              </Link>
              <Link
                href="https://sonu-daryani-portfolio.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                onClick={closeMenu}
              >
                <Globe size={16} />
                Portfolio
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
