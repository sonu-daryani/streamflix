"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StreamPlayer from "@/components/StreamPlayer";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import CatalogHoverCard from "@/components/CatalogHoverCard";
import type { ContentItem } from "@/lib/types";
import { catalogMatchPercent, catalogSeasonsLabel } from "@/lib/catalogUi";

export default function MoviesScreen() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<ContentItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const PAGE_SIZE = 24;

  const loadMovies = useCallback(async (nextPage: number, replace = false) => {
    if (isLoading) return;
    setIsLoading(true);
    const response = await fetch(
      `/api/content?category=movie&page=${nextPage}&limit=${PAGE_SIZE}`,
    );
    const data = (await response.json()) as {
      items: ContentItem[];
      hasMore: boolean;
    };
    setItems((prev) =>
      replace
        ? data.items
        : [...prev, ...data.items.filter((item) => !prev.some((p) => p.id === item.id))],
    );
    setHasMore(Boolean(data.hasMore));
    setPage(nextPage);
    setIsLoading(false);
  }, [isLoading]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: () => loadMovies(page + 1),
  });

  useEffect(() => {
    let cancelled = false;
    const initialLoad = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/content?category=movie&page=1&limit=${PAGE_SIZE}`);
      const data = (await response.json()) as {
        items: ContentItem[];
        hasMore: boolean;
      };
      if (cancelled) return;
      setItems(data.items);
      setHasMore(Boolean(data.hasMore));
      setPage(1);
      setIsLoading(false);
    };
    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  const movies = useMemo(
    () =>
      items.filter(
        (item) => (item.category || "").trim().toLowerCase() === "movie",
      ),
    [items],
  );

  return (
    <div className="min-h-screen overflow-x-clip overflow-y-visible bg-[#121212] text-white">
      <TopNav />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl overflow-visible px-4 pb-16 pt-24 outline-none sm:px-6"
      >
        <header className="mb-10 border-b border-white/[0.08] pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400/90">Browse</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Movies</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">
            Everything in your CMS catalog, optimized for browsing and instant playback.
          </p>
        </header>
        <div className="grid grid-cols-2 gap-3 overflow-visible pb-16 pt-4 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {movies.map((item) => (
            <CatalogHoverCard
              key={item.id}
              density="cozy"
              hoverStyle="netflix"
              posterSrc={item.posterSrc}
              title={item.title}
              subtitle={`${item.genre} • ${item.year}`}
              metaLine={`${item.year} • ${item.genre}`}
              description={item.description}
              previewThumbs={[item.posterSrc]}
              matchPercent={catalogMatchPercent(item.id)}
              seasonsLabel={catalogSeasonsLabel(item)}
              onCardClick={() => {
                setSelectedMovie(item);
                setIsPlayerOpen(false);
              }}
              onPlay={() => {
                setSelectedMovie(item);
                setIsPlayerOpen(true);
              }}
            />
          ))}
        </div>
        {isLoading ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-[#e50914]" />
              Loading more…
            </span>
          </p>
        ) : null}
        {hasMore ? <div ref={sentinelRef} className="h-10" /> : null}
      </main>

      {selectedMovie && !isPlayerOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.1] bg-zinc-900/98 shadow-2xl ring-1 ring-white/5">
            <div
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${selectedMovie.posterSrc})` }}
            />
            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-2xl font-bold tracking-tight">{selectedMovie.title}</h3>
                <button
                  type="button"
                  className="btn-ghost shrink-0 text-sm"
                  onClick={() => setSelectedMovie(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400/95">
                {selectedMovie.genre} · {selectedMovie.year}
              </p>
              <p className="leading-relaxed text-zinc-300">{selectedMovie.description}</p>
              <button
                type="button"
                className="btn-primary px-7 py-3"
                onClick={() => setIsPlayerOpen(true)}
              >
                Play
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMovie && isPlayerOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  setIsPlayerOpen(false);
                  setSelectedMovie(null);
                }}
              >
                Close player
              </button>
            </div>
            <StreamPlayer
              title={selectedMovie.title}
              streamUrl={selectedMovie.playbackUrl || selectedMovie.streamUrl || ""}
              streamType={selectedMovie.streamType}
              posterSrc={selectedMovie.posterSrc}
            />
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
