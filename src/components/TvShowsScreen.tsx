"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StreamPlayer from "@/components/StreamPlayer";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import CatalogHoverCard from "@/components/CatalogHoverCard";
import type { ContentItem } from "@/lib/types";
import { catalogMatchPercent, catalogSeasonsLabel } from "@/lib/catalogUi";
import { Play } from "lucide-react";

const episodeThumb = (episode: NonNullable<ContentItem["episodes"]>[number], fallback: string) =>
  episode.posterSrc?.trim() ? episode.posterSrc : fallback;

export default function TvShowsScreen() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeShow, setActiveShow] = useState<ContentItem | null>(null);
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);
  const [activeSeason, setActiveSeason] = useState("Season 1");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [highlightedEpisodeIndex, setHighlightedEpisodeIndex] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  const loadShows = useCallback(async (nextPage: number, replace = false) => {
    if (isLoading) return;
    setIsLoading(true);
    const response = await fetch(
      `/api/content?category=tvshow&page=${nextPage}&limit=${PAGE_SIZE}`,
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
    onLoadMore: () => loadShows(page + 1),
  });

  useEffect(() => {
    let cancelled = false;
    const initialLoad = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/content?category=tvshow&page=1&limit=${PAGE_SIZE}`);
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

  const shows = useMemo(
    () => items.filter((item) => (item.category || "").toLowerCase() === "tvshow"),
    [items],
  );

  const activeEpisode = useMemo(() => {
    if (!activeShow?.episodes?.length) return null;
    return activeShow.episodes[activeEpisodeIndex] || activeShow.episodes[0];
  }, [activeEpisodeIndex, activeShow]);

  const seasonGroups = useMemo(() => {
    const grouped = new Map<
      string,
      Array<{ episode: NonNullable<ContentItem["episodes"]>[number]; index: number }>
    >();
    (activeShow?.episodes || []).forEach((episode, index) => {
      const seasonName = episode.seasonTitle || "Season 1";
      const bucket = grouped.get(seasonName) || [];
      bucket.push({ episode, index });
      grouped.set(seasonName, bucket);
    });
    return grouped;
  }, [activeShow]);

  const seasonNames = useMemo(() => Array.from(seasonGroups.keys()), [seasonGroups]);
  const visibleEpisodes = seasonGroups.get(activeSeason) || [];

  const modalHeroEpisode = useMemo(() => {
    if (!activeShow?.episodes?.length || highlightedEpisodeIndex === null) return null;
    return activeShow.episodes[highlightedEpisodeIndex] ?? null;
  }, [activeShow, highlightedEpisodeIndex]);

  const openShowDetail = (show: ContentItem) => {
    setActiveShow(show);
    setActiveEpisodeIndex(0);
    const firstSeason = show.episodes?.[0]?.seasonTitle || "Season 1";
    setActiveSeason(firstSeason);
    setIsPlayerOpen(false);
    setHighlightedEpisodeIndex(null);
  };

  const playTvFromCard = (show: ContentItem) => {
    setActiveShow(show);
    setActiveEpisodeIndex(0);
    const firstSeason = show.episodes?.[0]?.seasonTitle || "Season 1";
    setActiveSeason(firstSeason);
    setHighlightedEpisodeIndex(null);
    setIsPlayerOpen(Boolean(show.episodes?.[0]));
  };

  const closeModal = () => {
    setActiveShow(null);
    setIsPlayerOpen(false);
    setActiveEpisodeIndex(0);
    setActiveSeason("Season 1");
    setHighlightedEpisodeIndex(null);
  };

  return (
    <div className="min-h-screen overflow-x-clip overflow-y-visible bg-[#121212] text-white">
      <TopNav />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl overflow-visible px-4 pb-16 pt-24 outline-none sm:px-6"
      >
        <header className="mb-10 border-b border-white/[0.08] pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400/90">Series</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">TV Shows</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">
            Open a show to browse seasons and episodes, then jump straight into playback.
          </p>
        </header>
        <div className="grid grid-cols-2 gap-3 overflow-visible pb-16 pt-4 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {shows.map((item) => {
            const previewEpisodes = (item.episodes || []).slice(0, 4);
            const episodeCount = item.episodes?.length ?? 0;
            const subtitle = `${item.genre} • ${item.year}${episodeCount > 0 ? ` • ${episodeCount} ep.` : ""}`;
            const metaLine = `${item.year} • ${item.genre}${episodeCount > 0 ? ` • ${episodeCount} episodes` : ""}`;
            return (
              <CatalogHoverCard
                key={item.id}
                density="cozy"
                hoverStyle="netflix"
                posterSrc={item.posterSrc}
                title={item.title}
                subtitle={subtitle}
                metaLine={metaLine}
                description={item.description || "Browse seasons and episodes."}
                previewThumbs={previewEpisodes.map((ep) => episodeThumb(ep, item.posterSrc))}
                matchPercent={catalogMatchPercent(item.id)}
                seasonsLabel={catalogSeasonsLabel(item)}
                onCardClick={() => openShowDetail(item)}
                onPlay={() => playTvFromCard(item)}
              />
            );
          })}
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

      {activeShow ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl space-y-4">
            <div className="flex justify-end">
              <button type="button" className="btn-ghost text-sm" onClick={closeModal}>
                Close
              </button>
            </div>

            {!isPlayerOpen ? (
              <div className="overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-zinc-900 to-[#0a0f1a] shadow-2xl ring-1 ring-white/5">
                <div className="grid gap-0 lg:grid-cols-[minmax(280px,1fr)_1.15fr]">
                  <div className="relative min-h-[220px] lg:min-h-[420px]">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out"
                      style={{
                        backgroundImage: `url(${
                          modalHeroEpisode
                            ? episodeThumb(modalHeroEpisode, activeShow.posterSrc)
                            : activeShow.posterSrc
                        })`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 lg:bg-gradient-to-r" />
                    <div className="relative flex h-full min-h-[220px] flex-col justify-end p-5 lg:min-h-[420px] lg:p-8">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400">
                        {modalHeroEpisode ? "Episode" : "Series"}
                      </p>
                      <h3 className="text-2xl font-black leading-tight md:text-4xl">
                        {modalHeroEpisode ? modalHeroEpisode.title : activeShow.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-zinc-300">
                        {modalHeroEpisode
                          ? modalHeroEpisode.description || activeShow.description
                          : activeShow.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                          {activeShow.genre}
                        </span>
                        <span className="rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                          {activeShow.year}
                        </span>
                        {modalHeroEpisode ? (
                          <span className="rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                            E{modalHeroEpisode.episodeNumber}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="btn-primary mt-5 inline-flex w-fit items-center gap-2 px-7 py-3 text-sm font-bold"
                        onClick={() => {
                          const idx =
                            highlightedEpisodeIndex !== null
                              ? highlightedEpisodeIndex
                              : (visibleEpisodes[0]?.index ?? 0);
                          setActiveEpisodeIndex(idx);
                          setIsPlayerOpen(true);
                        }}
                      >
                        <Play className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
                        Play
                      </button>
                    </div>
                  </div>

                  <div className="flex max-h-[min(70vh,520px)] flex-col border-t border-white/10 lg:border-l lg:border-t-0">
                    <div className="shrink-0 space-y-3 border-b border-white/10 p-4">
                      <p className="text-sm font-semibold text-zinc-100">Episodes</p>
                      <div className="flex flex-wrap gap-2">
                        {seasonNames.map((season) => (
                          <button
                            key={season}
                            type="button"
                            onClick={() => {
                              setActiveSeason(season);
                              setHighlightedEpisodeIndex(null);
                            }}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              activeSeason === season
                                ? "border-red-500 bg-red-600/25 text-white"
                                : "border-white/15 bg-zinc-950/80 text-zinc-400 hover:border-white/30 hover:text-zinc-200"
                            }`}
                          >
                            {season}{" "}
                            <span className="text-zinc-500">({seasonGroups.get(season)?.length || 0})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div
                      className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 pr-2"
                      onMouseLeave={() => setHighlightedEpisodeIndex(null)}
                    >
                      {visibleEpisodes.map(({ episode, index }) => {
                        const isFocused = highlightedEpisodeIndex === index;
                        return (
                          <button
                            key={episode.id}
                            type="button"
                            onMouseEnter={() => setHighlightedEpisodeIndex(index)}
                            onFocus={() => setHighlightedEpisodeIndex(index)}
                            onClick={() => {
                              setActiveEpisodeIndex(index);
                              setIsPlayerOpen(true);
                            }}
                            className={`group/ep flex w-full gap-3 rounded-lg border p-2 text-left transition ${
                              isFocused
                                ? "border-white/30 bg-white/10 ring-1 ring-white/20"
                                : "border-transparent bg-zinc-950/40 hover:border-white/15 hover:bg-white/5"
                            }`}
                          >
                            <div className="relative w-36 shrink-0 overflow-hidden rounded-md sm:w-44">
                              <div
                                className="aspect-video w-full bg-cover bg-center transition duration-300 group-hover/ep:scale-105"
                                style={{
                                  backgroundImage: `url(${episodeThumb(episode, activeShow.posterSrc)})`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover/ep:opacity-100">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg">
                                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} aria-hidden />
                                </span>
                              </div>
                              <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                                {episode.episodeNumber}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                              <p className="line-clamp-1 text-sm font-semibold text-white">
                                {episode.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                                {episode.description || "No synopsis."}
                              </p>
                            </div>
                            <div className="hidden shrink-0 items-center pr-1 sm:flex">
                              <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] text-zinc-400 transition group-hover/ep:border-red-500/50 group-hover/ep:text-rose-300">
                                Play
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeEpisode ? (
              <StreamPlayer
                title={`${activeShow.title} • ${activeEpisode.title}`}
                streamUrl={activeEpisode.streamUrl}
                streamType={activeEpisode.streamType}
                posterSrc={activeEpisode.posterSrc}
                onNext={
                  activeShow.episodes && activeEpisodeIndex < activeShow.episodes.length - 1
                    ? () => setActiveEpisodeIndex((prev) => prev + 1)
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
