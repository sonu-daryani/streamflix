"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Clapperboard,
  LayoutGrid,
  Menu,
  Search,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tv-shows", label: "TV Series" },
  { href: "/movies", label: "Movies" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [genres, setGenres] = useState<string[]>([]);
  const queryParam = searchParams.get("q") || "";
  const genreParam = searchParams.get("genre") || "all";
  const hasActiveFilters = Boolean(queryParam.trim()) || genreParam !== "all";
  const blendOverHero = pathname === "/" && !hasActiveFilters;

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasActiveFilters) queueMicrotask(() => setSearchOpen(true));
  }, [hasActiveFilters]);

  useEffect(() => {
    queueMicrotask(() => setMenuOpen(false));
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
      <div
        className={`fixed inset-x-0 top-0 z-50 ${
          blendOverHero && !searchOpen
            ? "border-b border-transparent bg-gradient-to-b from-black via-black/70 to-transparent pb-1 shadow-none backdrop-blur-[2px]"
            : "border-b border-white/[0.08] bg-black/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
              <button
                type="button"
                className="inline-flex shrink-0 rounded-sm p-2 text-zinc-200 transition hover:bg-white/10 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="topnav-mobile-drawer"
                onClick={() => (menuOpen ? closeMenu() : openMenu())}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
              </button>
              <Link
                href="/"
                className="group/logo flex shrink-0 items-center gap-2 text-xl font-black tracking-tight text-white sm:text-2xl"
                onClick={closeMenu}
              >
                <span className="flex rounded-lg bg-gradient-to-br from-blue-500/25 to-violet-500/15 p-1.5 ring-1 ring-white/10 transition group-hover/logo:ring-white/20">
                  <Clapperboard className="h-5 w-5 text-blue-300 sm:h-6 sm:w-6" aria-hidden />
                </span>
                <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  StreamFlix
                </span>
              </Link>
              <nav
                className="hidden items-center gap-5 text-sm font-medium text-zinc-200 md:flex"
                aria-label="Main"
              >
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition hover:text-white ${
                      pathname === item.href ? "font-semibold text-white" : "text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/live-tv"
                  className={`transition hover:text-white ${
                    pathname === "/live-tv" ? "font-semibold text-white" : "text-zinc-300"
                  }`}
                >
                  Live TV
                </Link>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              <button
                type="button"
                id="topnav-search-toggle"
                aria-expanded={searchOpen}
                aria-controls="topnav-search-panel"
                onClick={toggleSearch}
                className={`rounded-sm p-2 text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500/80 ${
                  searchOpen ? "bg-white/15" : "hover:bg-white/10"
                }`}
                aria-label={searchOpen ? "Close search" : "Open search"}
              >
                <Search size={20} strokeWidth={2} />
              </button>
              <Link
                href="/live-tv"
                className="hidden rounded-sm p-2 text-white transition hover:bg-white/10 sm:inline-flex"
                aria-label="Browse collections"
              >
                <LayoutGrid size={20} strokeWidth={2} />
              </Link>
              <span className="relative hidden sm:inline-flex">
                <span
                  className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e50914] px-1 text-[10px] font-bold leading-none text-white"
                  aria-hidden
                >
                  3
                </span>
                <button
                  type="button"
                  className="rounded-sm p-2 text-white transition hover:bg-white/10"
                  aria-label="Notifications"
                >
                  <Bell size={20} strokeWidth={2} />
                </button>
              </span>
              <Link
                href="/cms"
                className="hidden rounded-sm px-2 py-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white lg:inline"
              >
                CMS
              </Link>
              <button
                type="button"
                className="hidden items-center gap-1 rounded-sm py-1.5 pl-1 pr-0 text-white transition hover:bg-white/10 sm:flex"
                aria-label="Account"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#e50914] text-lg leading-none text-white"
                  aria-hidden
                >
                  <span className="-mt-0.5 block">:)</span>
                </span>
                <ChevronDown className="h-4 w-4 text-white" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>

          {searchOpen ? (
            <div
              ref={searchPanelRef}
              id="topnav-search-panel"
              role="search"
              aria-label="Search and filter catalog"
              className="flex flex-col gap-3 border-t border-white/[0.1] pt-3 sm:flex-row sm:flex-wrap sm:items-end"
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

      <div
        className={`fixed inset-0 z-[90] md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 z-0 bg-black/80 transition-opacity ${
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
          className={`absolute left-0 top-0 z-[1] flex h-full w-[min(100%,20rem)] flex-col border-r border-white/[0.08] bg-black shadow-[8px_0_40px_rgba(0,0,0,0.65)] transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Menu</p>
            <button
              type="button"
              className="rounded-sm p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Mobile main">
            {[...navItems, { href: "/live-tv", label: "Live TV" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`rounded-lg px-3 py-3 text-base font-medium transition ${
                  pathname === item.href
                    ? "bg-white/12 text-white"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/cms"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              CMS
            </Link>
          </nav>
        </aside>
      </div>
    </>
  );
}
