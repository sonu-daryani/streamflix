"use client";

import { useEffect, useState } from "react";
import StreamPlayer from "@/components/StreamPlayer";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import type { ContentItem, TvChannel } from "@/lib/types";
import { useCatalogStore } from "@/stores/catalogStore";
import { useSearchParams } from "next/navigation";
import CatalogHoverCard from "@/components/CatalogHoverCard";
import CatalogRailSwiper from "@/components/CatalogRailSwiper";
import { SwiperSlide } from "swiper/react";

export default function HomeScreen() {
  const searchParams = useSearchParams();
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
      setActivePlayerItem({
        id: item.id,
        title: `${item.title} • ${firstEp.title}`,
        description: firstEp.description || item.description,
        genre: item.genre,
        year: firstEp.year ?? item.year,
        featured: item.featured,
        posterSrc: firstEp.posterSrc || item.posterSrc,
        streamUrl: firstEp.streamUrl,
        streamType: firstEp.streamType,
      });
    } else {
      setActivePlayerItem({
        ...item,
        streamUrl: item.playbackUrl || item.streamUrl,
      });
    }
    setIsPlayerOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-clip overflow-y-visible bg-[#050505] text-white">
      <TopNav />

      <main className="overflow-visible pt-20">
        <section className="relative h-[68vh] min-h-[480px] overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featuredItem?.posterSrc ?? ""})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/30 to-transparent" />
          <div className="relative mx-auto flex h-full w-full max-w-7xl items-end px-6 pb-14">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-300">Featured</p>
              <h2 className="text-5xl font-black leading-tight md:text-7xl">
                {featuredItem?.title ?? "Loading..."}
              </h2>
              <p className="mt-4 line-clamp-3 text-zinc-300">
                {featuredItem?.description ??
                  "Discover trending movies and shows in a cinematic UI."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-blue-900/30 hover:bg-blue-500"
                  onClick={() => {
                    if (!featuredItem) return;
                    setActivePlayerItem({
                      ...featuredItem,
                      streamUrl: featuredItem.playbackUrl || featuredItem.streamUrl,
                    });
                    setIsPlayerOpen(true);
                  }}
                >
                  Play
                </button>
                <button
                  type="button"
                  className="rounded-md bg-zinc-700/80 px-6 py-2 text-sm font-semibold hover:bg-zinc-600"
                  onClick={() => {
                    if (!featuredItem) return;
                    setSelectedItem(featuredItem);
                  }}
                >
                  More Info
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl space-y-12 overflow-visible px-6 py-12">
          {isLoading ? <p className="text-zinc-400">Loading...</p> : null}
          {visibleRails.map((rail) => (
            <section key={rail.title} className="overflow-visible">
              <h3 className="mb-4 text-xl font-semibold">{rail.title}</h3>
              <CatalogRailSwiper variant="poster">
                {rail.items.map((item, index) => (
                  <SwiperSlide key={`${rail.title}-${item.id}`} className="!h-auto py-6">
                    <CatalogHoverCard
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
            <section className="overflow-visible">
              <h3 className="mb-4 text-xl font-semibold">Live TV</h3>
              <CatalogRailSwiper variant="video">
                {tvChannels.map((channel) => (
                  <SwiperSlide key={channel.id} className="!h-auto py-6">
                    <CatalogHoverCard
                      aspect="video"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div
              className="aspect-video bg-cover bg-center"
              style={{ backgroundImage: `url(${homeLiveChannel.posterSrc})` }}
            />
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Live</p>
                  <h3 className="text-xl font-bold">{homeLiveChannel.title}</h3>
                  <p className="text-sm text-blue-300">{homeLiveChannel.group}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                  onClick={() => setHomeLiveChannel(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-sm text-zinc-400">Watch this channel from your M3U playlist.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
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
                  Play
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-5xl space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                onClick={() => setIsPlayerOpen(false)}
              >
                Close Player
              </button>
            </div>
            <StreamPlayer
              title={activePlayerItem.title}
              streamUrl={activePlayerItem.playbackUrl || activePlayerItem.streamUrl || ""}
              streamType={activePlayerItem.streamType}
              posterSrc={activePlayerItem.posterSrc}
            />
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 md:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${selectedItem.posterSrc})` }}
            />
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-bold">{selectedItem.title}</h3>
                <button
                  type="button"
                  className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-sm uppercase text-blue-300">
                {selectedItem.genre} • {selectedItem.year}
              </p>
              <p className="text-zinc-300">{selectedItem.description}</p>
              <button
                type="button"
                className="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-500"
                onClick={() => {
                  setActivePlayerItem({
                    ...selectedItem,
                    streamUrl: selectedItem.playbackUrl || selectedItem.streamUrl,
                  });
                  setIsPlayerOpen(true);
                  setSelectedItem(null);
                }}
              >
                Play
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
