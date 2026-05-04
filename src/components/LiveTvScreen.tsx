"use client";

import { useCallback, useEffect, useState } from "react";
import StreamPlayer from "@/components/StreamPlayer";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import CatalogHoverCard from "@/components/CatalogHoverCard";
import type { ContentItem, TvChannel } from "@/lib/types";

export default function LiveTvScreen() {
  const [channels, setChannels] = useState<TvChannel[]>([]);
  const [active, setActive] = useState<ContentItem | null>(null);
  const [infoChannel, setInfoChannel] = useState<TvChannel | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 24;

  const loadChannels = useCallback(async (offset: number, replace = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tv?offset=${offset}&limit=${PAGE_SIZE}`);
      if (!response.ok) {
        throw new Error("Failed to load Live TV channels.");
      }
      const data = (await response.json()) as {
        channels: TvChannel[];
        hasMore: boolean;
        nextOffset: number | null;
      };
      setError(null);
      setChannels((prev) =>
        replace
          ? data.channels
          : [...prev, ...data.channels.filter((channel) => !prev.some((p) => p.id === channel.id))],
      );
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset);
    } catch {
      if (replace) {
        setChannels([]);
        setHasMore(false);
        setNextOffset(null);
      }
      setError("Live TV playlist is unavailable. Add data/tv.m3u to load channels.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: () => {
      if (nextOffset === null) return;
      return loadChannels(nextOffset);
    },
  });

  useEffect(() => {
    void loadChannels(0, true);
  }, [loadChannels]);

  return (
    <div className="min-h-screen overflow-x-clip overflow-y-visible bg-[#050505] text-white">
      <TopNav />
      <main className="mx-auto max-w-7xl overflow-visible px-4 pb-16 pt-24 sm:px-6">
        <h2 className="mb-2 text-2xl font-black sm:text-4xl">Live TV</h2>
        <p className="mb-6 text-zinc-400">Live channels from your M3U playlist.</p>
        {error ? <p className="mb-4 text-sm text-blue-300">{error}</p> : null}
        {!isLoading && !error && channels.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-400">No channels found in your playlist.</p>
        ) : null}
        <div className="grid grid-cols-2 gap-3 overflow-visible pb-16 pt-4 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {channels.map((channel) => {
            const asContent = (): ContentItem => ({
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
            return (
              <CatalogHoverCard
                key={channel.id}
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
                onCardClick={() => setInfoChannel(channel)}
                onPlay={() => setActive(asContent())}
              />
            );
          })}
        </div>
        {isLoading ? <p className="mt-6 text-center text-sm text-zinc-400">Loading more...</p> : null}
        {hasMore ? <div ref={sentinelRef} className="h-10" /> : null}
      </main>

      {infoChannel ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div
              className="aspect-video bg-cover bg-center"
              style={{ backgroundImage: `url(${infoChannel.posterSrc})` }}
            />
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Live</p>
                  <h3 className="text-xl font-bold">{infoChannel.title}</h3>
                  <p className="text-sm text-blue-300">{infoChannel.group}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                  onClick={() => setInfoChannel(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-sm text-zinc-400">
                Watch this channel live. Playback opens in the player below.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  onClick={() => {
                    setActive({
                      id: infoChannel.id,
                      title: infoChannel.title,
                      description: `Live channel from ${infoChannel.group}`,
                      genre: infoChannel.group,
                      year: new Date().getFullYear(),
                      featured: false,
                      posterSrc: infoChannel.posterSrc,
                      streamUrl: infoChannel.playbackUrl,
                      streamType: infoChannel.streamType,
                    });
                    setInfoChannel(null);
                  }}
                >
                  Play
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                  onClick={() => setInfoChannel(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {active ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-5xl space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded bg-zinc-700 px-3 py-1 text-sm hover:bg-zinc-600"
                onClick={() => setActive(null)}
              >
                Close
              </button>
            </div>
            <StreamPlayer
              title={active.title}
              streamUrl={active.streamUrl || ""}
              streamType={active.streamType}
              posterSrc={active.posterSrc}
            />
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
