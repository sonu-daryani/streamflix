"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StreamPlayer from "@/components/StreamPlayer";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import CatalogHoverCard from "@/components/CatalogHoverCard";
import type { ContentItem } from "@/lib/types";

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
    <div className="min-h-screen overflow-x-clip overflow-y-visible bg-[#050505] text-white">
      <TopNav />
      <main className="mx-auto max-w-7xl overflow-visible px-4 pb-16 pt-24 sm:px-6">
        <h2 className="mb-2 text-2xl font-black sm:text-4xl">Movies</h2>
        <p className="mb-6 text-zinc-400">Movie collection from your CMS catalog.</p>
        <div className="grid grid-cols-2 gap-3 overflow-visible pb-16 pt-4 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {movies.map((item) => (
            <CatalogHoverCard
              key={item.id}
              posterSrc={item.posterSrc}
              title={item.title}
              subtitle={`${item.genre} • ${item.year}`}
              metaLine={`${item.year} • ${item.genre}`}
              description={item.description}
              previewThumbs={[item.posterSrc]}
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
        {isLoading ? <p className="mt-6 text-center text-sm text-zinc-400">Loading more...</p> : null}
        {hasMore ? <div ref={sentinelRef} className="h-10" /> : null}
      </main>

      {selectedMovie && !isPlayerOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${selectedMovie.posterSrc})` }}
            />
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-bold">{selectedMovie.title}</h3>
                <button
                  type="button"
                  className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                  onClick={() => setSelectedMovie(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-sm uppercase text-blue-300">
                {selectedMovie.genre} • {selectedMovie.year}
              </p>
              <p className="text-zinc-300">{selectedMovie.description}</p>
              <button
                type="button"
                className="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-500"
                onClick={() => setIsPlayerOpen(true)}
              >
                Play
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMovie && isPlayerOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-5xl space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                onClick={() => {
                  setIsPlayerOpen(false);
                  setSelectedMovie(null);
                }}
              >
                Close
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
