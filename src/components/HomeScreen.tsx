"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Info, Play, Sparkles } from "lucide-react";
import StreamPlayer from "@/components/StreamPlayer";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import type { ContentItem, TvChannel } from "@/lib/types";
import { useCatalogStore } from "@/stores/catalogStore";
import { useSearchParams } from "next/navigation";
import CatalogHoverCard from "@/components/CatalogHoverCard";
import CatalogRailSwiper from "@/components/CatalogRailSwiper";
import { SwiperSlide } from "swiper/react";

const episodeThumb = (
  episode: NonNullable<ContentItem["episodes"]>[number],
  fallback: string,
) => (episode.posterSrc?.trim() ? episode.posterSrc : fallback);

/** Flatten episode into a ContentItem for the shared player */
function episodePlayerItem(show: ContentItem, episodeIndex: number): ContentItem {
  const ep = show.episodes![episodeIndex];
  return {
    id: show.id,
    title: `${show.title} • ${ep.title}`,
    description: ep.description || show.description,
    genre: show.genre,
    year: ep.year ?? show.year,
    featured: show.featured,
    posterSrc: episodeThumb(ep, show.posterSrc),
    streamUrl: ep.streamUrl,
    streamType: ep.streamType,
  };
}

export default function HomeScreen() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q")?.trim() ?? "";
  const genreParam = searchParams.get("genre") ?? "all";
  const hasActiveFilters = Boolean(queryParam) || genreParam !== "all";

  const {
    items,
    genres,
    isLoading,
    loadInitial,
    loadCatalog,
    setSelectedGenre,
  } = useCatalogStore();

  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [tvChannels, setTvChannels] = useState<TvChannel[]>([]);
  const [activePlayerItem, setActivePlayerItem] = useState<ContentItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [homeLiveChannel, setHomeLiveChannel] = useState<TvChannel | null>(null);
  /** Full catalog item while playing an episode (rail or modal) — powers episode advance */
  const [playbackSourceItem, setPlaybackSourceItem] = useState<ContentItem | null>(null);
  const [homeEpisodeIndex, setHomeEpisodeIndex] = useState(0);
  const [detailSeason, setDetailSeason] = useState("Season 1");
  const [highlightedEpisodeIndex, setHighlightedEpisodeIndex] = useState<number | null>(null);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const query = searchParams.get("q") || "";
    const genre = searchParams.get("genre") || "all";
    setSelectedGenre(genre);
    void loadCatalog(genre, query);
  }, [loadCatalog, searchParams, setSelectedGenre]);

  useEffect(() => {
    const loadTv = async () => {
      const response = await fetch("/api/tv");
      const data = (await response.json()) as { channels: TvChannel[] };
      setTvChannels(data.channels);
    };
    void loadTv();
  }, []);

  useEffect(() => {
    if (!selectedItem?.episodes?.length) {
      setHighlightedEpisodeIndex(null);
      return;
    }
    const first = selectedItem.episodes[0];
    setDetailSeason(first.seasonTitle || "Season 1");
    setHighlightedEpisodeIndex(null);
  }, [selectedItem]);

  const featuredItem = items.find((item) => item.featured) ?? items[0];
  const rails = [
    { title: "Now Playing", items: items.slice(0, 10) },
    { title: "Trending", items: items.slice(2, 12) },
    ...genres.slice(0, 4).map((genre) => ({
      title: `${genre} Picks`,
      items: items.filter((item) => item.genre === genre).slice(0, 10),
    })),
  ];
  const visibleRails = rails.filter((rail) => rail.items.length > 0);

  const railPreviewThumbs = (item: ContentItem) => {
    const eps = item.episodes || [];
    if (eps.length === 0) return [item.posterSrc];
    return eps.slice(0, 4).map((ep) => (ep.posterSrc?.trim() ? ep.posterSrc : item.posterSrc));
  };

  const railMetaLine = (item: ContentItem) => {
    const ep = item.episodes?.length ?? 0;
    const parts = [`${item.year}`, item.genre];
    if (ep > 0) parts.push(`${ep} episodes`);
    return parts.join(" • ");
  };

  const playRailItem = (item: ContentItem) => {
    const firstEp = item.episodes?.[0];
    if (firstEp) {
      setPlaybackSourceItem(item);
      setHomeEpisodeIndex(0);
      setActivePlayerItem(episodePlayerItem(item, 0));
    } else {
      setPlaybackSourceItem(null);
      setActivePlayerItem({
        ...item,
        streamUrl: item.playbackUrl || item.streamUrl,
      });
    }
    setIsPlayerOpen(true);
  };

  const seasonGroups = useMemo(() => {
    const grouped = new Map<
      string,
      Array<{ episode: NonNullable<ContentItem["episodes"]>[number]; index: number }>
    >();
    const eps = selectedItem?.episodes;
    if (!eps?.length) return grouped;
    eps.forEach((episode, index) => {
      const seasonName = episode.seasonTitle || "Season 1";
      const bucket = grouped.get(seasonName) || [];
      bucket.push({ episode, index });
      grouped.set(seasonName, bucket);
    });
    return grouped;
  }, [selectedItem]);

  const seasonNames = useMemo(() => Array.from(seasonGroups.keys()), [seasonGroups]);

  const visibleEpisodes = useMemo(
    () => seasonGroups.get(detailSeason) || [],
    [seasonGroups, detailSeason],
  );

  const modalHeroEpisode = useMemo(() => {
    if (!selectedItem?.episodes?.length || highlightedEpisodeIndex === null) return null;
    return selectedItem.episodes[highlightedEpisodeIndex] ?? null;
  }, [selectedItem, highlightedEpisodeIndex]);

  const episodeAdvanceSource = playbackSourceItem;

  return (
    <div className="min-h-screen overflow-x-clip overflow-y-visible bg-[#121212] text-white">
      <TopNav />

      <main id="main-content" tabIndex={-1} className="overflow-visible pt-20 outline-none">
        <section className="relative min-h-[min(68vh,560px)] h-[56vh] overflow-hidden border-b border-white/[0.07] sm:h-[62vh] sm:min-h-[480px] md:h-[68vh]">
          {featuredItem?.posterSrc ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-[filter] duration-700"
              style={{ backgroundImage: `url(${featuredItem.posterSrc})` }}
              aria-hidden
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-[#121212]"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(229,9,20,0.11),transparent)]" />
          <div className="relative mx-auto flex h-full w-full max-w-7xl items-end px-4 pb-10 sm:px-6 sm:pb-14">
            <div className="max-w-2xl pb-1">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-300 backdrop-blur-md sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                Featured pick
              </p>
              <h1 className="text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                  {featuredItem?.title ?? (isLoading ? "Loading catalog…" : "Nothing to feature yet")}
                </span>
              </h1>
              {featuredItem ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-md">
                    {featuredItem.genre}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-md">
                    {featuredItem.year}
                  </span>
                  {featuredItem.featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100 backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      Spotlight
                    </span>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                {featuredItem?.description ??
                  (isLoading
                    ? "Hang tight—we’re loading titles from your catalog."
                    : "Add content in the CMS or clear filters to see titles here.")}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-primary px-7 py-3 text-sm sm:text-base disabled:pointer-events-none disabled:opacity-45"
                  disabled={
                    !featuredItem ||
                    !(featuredItem.episodes?.[0]?.streamUrl ||
                      featuredItem.playbackUrl ||
                      featuredItem.streamUrl)
                  }
                  onClick={() => {
                    if (!featuredItem) return;
                    const eps = featuredItem.episodes;
                    if (eps?.length) {
                      setPlaybackSourceItem(featuredItem);
                      setHomeEpisodeIndex(0);
                      setActivePlayerItem(episodePlayerItem(featuredItem, 0));
                    } else {
                      setPlaybackSourceItem(null);
                      setActivePlayerItem({
                        ...featuredItem,
                        streamUrl: featuredItem.playbackUrl || featuredItem.streamUrl,
                      });
                    }
                    setIsPlayerOpen(true);
                  }}
                >
                  <Play className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
                  Play
                </button>
                <button
                  type="button"
                  className="btn-secondary px-7 py-3 text-sm sm:text-base disabled:pointer-events-none disabled:opacity-45"
                  disabled={!featuredItem}
                  onClick={() => {
                    if (!featuredItem) return;
                    setSelectedItem(featuredItem);
                  }}
                >
                  <Info className="h-4 w-4 opacity-90" aria-hidden />
                  Synopsis
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl space-y-16 overflow-visible px-4 py-14 sm:space-y-[4.5rem] sm:px-6 sm:py-16">
          {hasActiveFilters ? (
            <div
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.1] bg-zinc-900/60 px-4 py-4 shadow-lg shadow-black/30 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5"
              role="status"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Filtered catalog</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {queryParam ? (
                    <>
                      Search matching <span className="text-zinc-200">&ldquo;{queryParam}&rdquo;</span>
                      {genreParam !== "all" ? <> · genre <span className="text-zinc-200">{genreParam}</span></> : null}
                    </>
                  ) : genreParam !== "all" ? (
                    <>
                      Genre: <span className="text-zinc-200">{genreParam}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <Link href="/" className="btn-secondary shrink-0 px-5 py-2.5 text-sm no-underline">
                Clear filters
              </Link>
            </div>
          ) : null}

          {isLoading && items.length === 0 ? (
            <div className="space-y-10" aria-busy aria-label="Loading catalog">
              {[0, 1].map((block) => (
                <div key={block} className="space-y-4">
                  <div className="h-7 max-w-[14rem] animate-pulse rounded-lg bg-zinc-800/80" />
                  <div className="flex gap-3 overflow-hidden pt-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`${block}-${i}`}
                        className="h-52 w-[164px] shrink-0 animate-pulse rounded-2xl bg-zinc-800/70 sm:h-60 sm:w-[176px]"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && visibleRails.length === 0 && tvChannels.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.1] bg-zinc-900/50 px-6 py-14 text-center shadow-inner shadow-black/40 backdrop-blur-md">
              <p className="text-lg font-semibold text-white">Nothing to show here yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                {hasActiveFilters ? (
                  <>
                    Try a shorter search, choose &ldquo;All genres&rdquo; in the nav, or clear filters to bring
                    titles back.
                  </>
                ) : (
                  <>Seed your catalog in the CMS, or check that your API is returning content.</>
                )}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {hasActiveFilters ? (
                  <Link href="/" className="btn-primary px-8 py-3 text-sm no-underline">
                    Show full catalog
                  </Link>
                ) : (
                  <Link href="/cms" className="btn-primary px-8 py-3 text-sm no-underline">
                    Open CMS
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          {!isLoading && visibleRails.length === 0 && tvChannels.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.1] bg-zinc-900/45 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm leading-relaxed text-zinc-300">
                {hasActiveFilters ? (
                  <>
                    No on-demand titles match your filters.{" "}
                    <span className="text-zinc-500">Live channels are still available below.</span>
                  </>
                ) : (
                  <>
                    No catalog rows yet.{" "}
                    <span className="text-zinc-500">Browse Live TV below or add titles in the CMS.</span>
                  </>
                )}
              </p>
              <div className="flex shrink-0 flex-wrap gap-2">
                {hasActiveFilters ? (
                  <Link href="/" className="btn-secondary px-5 py-2.5 text-sm no-underline">
                    Clear filters
                  </Link>
                ) : (
                  <Link href="/cms" className="btn-secondary px-5 py-2.5 text-sm no-underline">
                    Add content
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          {visibleRails.length > 0 ? (
            <p className="mb-2 text-sm leading-relaxed text-zinc-500 md:mb-4">
              <span className="md:hidden">
                Swipe each row to browse. Tap <span className="text-zinc-400">Play</span> to watch or{" "}
                <span className="text-zinc-400">Info</span> for the synopsis.
              </span>
              <span className="hidden md:inline">
                Hover a poster for a quick summary and actions, or use the arrows on each row to scroll.
              </span>
            </p>
          ) : tvChannels.length > 0 && !isLoading ? (
            <p className="mb-2 text-sm leading-relaxed text-zinc-500 md:mb-4">
              <span className="md:hidden">
                Swipe the Live TV row and tap <span className="text-zinc-400">Play</span> on a channel card.
              </span>
              <span className="hidden md:inline">
                Hover channel tiles for details, or use the arrows to move along the Live TV row.
              </span>
            </p>
          ) : null}

          {visibleRails.map((rail) => (
            <section
              key={rail.title}
              className="overflow-visible scroll-mt-24"
              aria-label={`${rail.title}, ${rail.items.length} titles`}
            >
              <div className="mb-6 flex flex-wrap items-end gap-3 md:mb-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{rail.title}</h2>
                    <span className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium tabular-nums text-zinc-400">
                      {rail.items.length}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                    {rail.title === "Trending"
                      ? "Popular picks in your library right now."
                      : rail.title === "Now Playing"
                        ? "Jump back into what’s lined up first."
                        : "Tap a card for the full synopsis."}
                  </p>
                </div>
                <span className="hidden min-h-px min-w-[2rem] flex-1 translate-y-[-6px] bg-gradient-to-r from-white/20 to-transparent sm:block" />
              </div>
              <CatalogRailSwiper variant="poster" relaxedGap>
                {rail.items.map((item, index) => (
                  <SwiperSlide key={`${rail.title}-${item.id}`} className="!flex py-2 md:py-4">
                    <CatalogHoverCard
                      density="cozy"
                      posterSrc={item.posterSrc}
                      title={item.title}
                      subtitle={`${item.genre} • ${item.year}`}
                      metaLine={railMetaLine(item)}
                      description={item.description}
                      rank={rail.title === "Trending" ? index + 1 : undefined}
                      previewThumbs={railPreviewThumbs(item)}
                      onCardClick={() => {
                        setSelectedItem(item);
                        setIsPlayerOpen(false);
                      }}
                      onPlay={() => playRailItem(item)}
                    />
                  </SwiperSlide>
                ))}
              </CatalogRailSwiper>
            </section>
          ))}

          {tvChannels.length > 0 ? (
            <section className="overflow-visible scroll-mt-24" aria-label={`Live TV, ${tvChannels.length} channels`}>
              <div className="mb-6 flex flex-wrap items-end gap-3 md:mb-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Live TV</h2>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium tabular-nums text-emerald-200/90">
                      {tvChannels.length}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                    Channels from your playlist—tap Play to tune in.
                  </p>
                </div>
                <span className="hidden min-h-px min-w-[2rem] flex-1 translate-y-[-6px] bg-gradient-to-r from-emerald-500/35 to-transparent sm:block" />
              </div>
              <CatalogRailSwiper variant="poster" relaxedGap>
                {tvChannels.map((channel) => (
                  <SwiperSlide key={channel.id} className="!flex py-2 md:py-4">
                    <CatalogHoverCard
                      density="cozy"
                      posterSrc={channel.posterSrc}
                      title={channel.title}
                      subtitle={channel.group}
                      metaLine={`Live • ${channel.group}`}
                      description={`Watch ${channel.title} live from your playlist.`}
                      previewThumbs={[channel.posterSrc]}
                      badge={
                        <p className="rounded-full bg-emerald-600/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Live
                        </p>
                      }
                      onCardClick={() => setHomeLiveChannel(channel)}
                      onPlay={() => {
                        setActivePlayerItem({
                          id: channel.id,
                          title: channel.title,
                          description: `Live channel from ${channel.group}`,
                          genre: channel.group,
                          year: new Date().getFullYear(),
                          featured: false,
                          posterSrc: channel.posterSrc,
                          streamUrl: channel.playbackUrl,
                          streamType: channel.streamType,
                        });
                        setIsPlayerOpen(true);
                      }}
                    />
                  </SwiperSlide>
                ))}
              </CatalogRailSwiper>
            </section>
          ) : null}
        </section>
      </main>

      {homeLiveChannel ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.1] bg-zinc-900/95 shadow-2xl shadow-black/60 ring-1 ring-white/5">
            <div
              className="aspect-video bg-cover bg-center"
              style={{ backgroundImage: `url(${homeLiveChannel.posterSrc})` }}
            />
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Live</p>
                  <h3 className="text-xl font-bold text-white">{homeLiveChannel.title}</h3>
                  <p className="text-sm text-rose-200/95">{homeLiveChannel.group}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost shrink-0 text-sm"
                  onClick={() => setHomeLiveChannel(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                Watch this channel from your M3U playlist.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary px-5 py-2.5 text-sm"
                  onClick={() => {
                    setActivePlayerItem({
                      id: homeLiveChannel.id,
                      title: homeLiveChannel.title,
                      description: `Live channel from ${homeLiveChannel.group}`,
                      genre: homeLiveChannel.group,
                      year: new Date().getFullYear(),
                      featured: false,
                      posterSrc: homeLiveChannel.posterSrc,
                      streamUrl: homeLiveChannel.playbackUrl,
                      streamType: homeLiveChannel.streamType,
                    });
                    setHomeLiveChannel(null);
                    setIsPlayerOpen(true);
                  }}
                >
                  <Play className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
                  Play
                </button>
                <button
                  type="button"
                  className="btn-secondary px-5 py-2.5 text-sm"
                  onClick={() => setHomeLiveChannel(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isPlayerOpen && activePlayerItem ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  setIsPlayerOpen(false);
                  setPlaybackSourceItem(null);
                }}
              >
                Close player
              </button>
            </div>
            <StreamPlayer
              title={activePlayerItem.title}
              streamUrl={activePlayerItem.playbackUrl || activePlayerItem.streamUrl || ""}
              streamType={activePlayerItem.streamType}
              posterSrc={activePlayerItem.posterSrc}
              onNext={
                episodeAdvanceSource?.episodes &&
                homeEpisodeIndex < episodeAdvanceSource.episodes.length - 1
                  ? () => {
                      const next = homeEpisodeIndex + 1;
                      setHomeEpisodeIndex(next);
                      setActivePlayerItem(episodePlayerItem(episodeAdvanceSource, next));
                    }
                  : undefined
              }
            />
          </div>
        </div>
      ) : null}

      {selectedItem && !isPlayerOpen ? (
        selectedItem.episodes?.length ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
            <div className="w-full max-w-5xl space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-zinc-900 to-[#0a0f1a] shadow-2xl ring-1 ring-white/5">
                <div className="grid gap-0 lg:grid-cols-[minmax(280px,1fr)_1.15fr]">
                  <div className="relative min-h-[220px] lg:min-h-[420px]">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out"
                      style={{
                        backgroundImage: `url(${
                          modalHeroEpisode
                            ? episodeThumb(modalHeroEpisode, selectedItem.posterSrc)
                            : selectedItem.posterSrc
                        })`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 lg:bg-gradient-to-r" />
                    <div className="relative flex h-full min-h-[220px] flex-col justify-end p-5 lg:min-h-[420px] lg:p-8">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400">
                        {modalHeroEpisode ? "Episode" : "Series"}
                      </p>
                      <h3 className="text-2xl font-black leading-tight md:text-4xl">
                        {modalHeroEpisode ? modalHeroEpisode.title : selectedItem.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-zinc-300">
                        {modalHeroEpisode
                          ? modalHeroEpisode.description || selectedItem.description
                          : selectedItem.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                          {selectedItem.genre}
                        </span>
                        <span className="rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                          {selectedItem.year}
                        </span>
                        {modalHeroEpisode ? (
                          <span className="rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                            E{modalHeroEpisode.episodeNumber}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="btn-primary mt-5 w-fit px-7 py-3 text-sm font-bold"
                        onClick={() => {
                          const idx =
                            highlightedEpisodeIndex !== null
                              ? highlightedEpisodeIndex
                              : (visibleEpisodes[0]?.index ?? 0);
                          setPlaybackSourceItem(selectedItem);
                          setHomeEpisodeIndex(idx);
                          setActivePlayerItem(episodePlayerItem(selectedItem, idx));
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
                              setDetailSeason(season);
                              setHighlightedEpisodeIndex(null);
                            }}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              detailSeason === season
                                ? "border-red-500 bg-red-600/25 text-white"
                                : "border-white/15 bg-zinc-950/80 text-zinc-400 hover:border-white/30 hover:text-zinc-200"
                            }`}
                          >
                            {season}{" "}
                            <span className="text-zinc-500">
                              ({seasonGroups.get(season)?.length || 0})
                            </span>
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
                              setPlaybackSourceItem(selectedItem);
                              setHomeEpisodeIndex(index);
                              setActivePlayerItem(episodePlayerItem(selectedItem, index));
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
                                  backgroundImage: `url(${episodeThumb(episode, selectedItem.posterSrc)})`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover/ep:opacity-100">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg">
                                  ▶
                                </span>
                              </div>
                              <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                                {episode.episodeNumber}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                              <p className="line-clamp-1 text-sm font-semibold text-white">{episode.title}</p>
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
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 backdrop-blur-md md:items-center">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.1] bg-zinc-900/98 shadow-2xl ring-1 ring-white/5">
              <div
                className="h-56 bg-cover bg-center sm:h-64"
                style={{ backgroundImage: `url(${selectedItem.posterSrc})` }}
              />
              <div className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      {(selectedItem.category || "").toLowerCase() === "movie" ? "Movie" : "Title"}
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight">{selectedItem.title}</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 text-sm"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400/95">
                  {selectedItem.genre} · {selectedItem.year}
                </p>
                <p className="leading-relaxed text-zinc-300">{selectedItem.description}</p>
                <button
                  type="button"
                  className="btn-primary px-7 py-3"
                  onClick={() => {
                    setPlaybackSourceItem(null);
                    setActivePlayerItem({
                      ...selectedItem,
                      streamUrl: selectedItem.playbackUrl || selectedItem.streamUrl,
                    });
                    setIsPlayerOpen(true);
                  }}
                >
                  <Play className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
                  Play now
                </button>
              </div>
            </div>
          </div>
        )
      ) : null}
      <Footer />
    </div>
  );
}
