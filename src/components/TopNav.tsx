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
    <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:min-w-0 md:flex-none md:flex-initial">
            <button
              type="button"
              className="inline-flex shrink-0 rounded-full border border-white/15 p-2 text-zinc-300 transition hover:border-white/40 hover:text-white md:hidden"
              aria-expanded={menuOpen}
              aria-controls="topnav-mobile-drawer"
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
            </button>
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-2xl font-black tracking-wide text-blue-400"
              onClick={closeMenu}
            >
              <span className="rounded-md bg-blue-500/20 p-1.5 text-blue-300">
                <Clapperboard size={18} className="text-blue-400" />
              </span>
              <span className="truncate">StreamFlix</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-5 text-sm text-zinc-300 md:flex" aria-label="Main">
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
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              id="topnav-search-toggle"
              aria-expanded={searchOpen}
              aria-controls="topnav-search-panel"
              onClick={toggleSearch}
              className={`rounded-full border p-2 transition hover:border-white/40 hover:text-white ${
                searchOpen
                  ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                  : "border-white/15 text-zinc-300"
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
            </span>
            <Link
              href="/cms"
              className="ml-0.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm shadow-blue-900/40 hover:bg-blue-500 sm:px-4 sm:py-2 sm:text-sm"
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
          className={`absolute left-0 top-0 z-[1] flex h-full w-[min(100%,20rem)] flex-col border-r border-white/10 bg-zinc-950 shadow-[4px_0_24px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Menu</p>
            <button
              type="button"
              className="rounded-full border border-white/15 p-2 text-zinc-300 transition hover:border-white/40 hover:text-white"
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
                className={`rounded-lg px-3 py-3 text-base font-medium ${
                  pathname === item.href
                    ? "bg-white/10 text-white"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Links</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="https://github.com/sonu-daryani"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                onClick={closeMenu}
              >
                <GitCommit size={16} />
                GitHub
              </Link>
              <Link
                href="https://www.linkedin.com/in/sonu-daryani-248a18202/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                onClick={closeMenu}
              >
                <ContactRound size={16} />
                LinkedIn
              </Link>
              <Link
                href="https://sonu-daryani-portfolio.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
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
