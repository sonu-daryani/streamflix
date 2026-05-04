"use client";

import type { ReactNode } from "react";
import { Play, Plus } from "lucide-react";

type CatalogHoverCardProps = {
  posterSrc: string;
  title: string;
  subtitle: string;
  description: string;
  metaLine?: string;
  aspect?: "poster" | "video";
  previewThumbs?: string[];
  badge?: ReactNode;
  rank?: number;
  onCardClick: () => void;
  onPlay: (event: React.MouseEvent) => void;
};

export default function CatalogHoverCard({
  posterSrc,
  title,
  subtitle,
  description,
  metaLine,
  aspect = "poster",
  previewThumbs = [],
  badge,
  rank,
  onCardClick,
  onPlay,
}: CatalogHoverCardProps) {
  const aspectClass = aspect === "video" ? "aspect-[16/9]" : "aspect-[2/3]";
  const isVideo = aspect === "video";
  const thumbs = previewThumbs.filter(Boolean).slice(0, 4);
  const meta = metaLine ?? subtitle;

  const imageObjectClass = isVideo
    ? "object-cover object-center"
    : "object-cover object-top";

  return (
    <article
      className="group/card relative z-0 flex h-full min-h-0 w-full min-w-0 flex-1 cursor-pointer flex-col p-1.5 transition-[transform,box-shadow,z-index] duration-300 ease-out will-change-transform sm:p-2 md:will-change-transform md:hover:z-25 md:hover:scale-[1.06] md:hover:-translate-y-4 md:focus-within:z-25 md:focus-within:scale-[1.06] md:focus-within:-translate-y-4 lg:hover:scale-[1.12] lg:hover:-translate-y-6 lg:focus-within:scale-[1.12] lg:focus-within:-translate-y-6 motion-reduce:md:hover:scale-100 motion-reduce:md:hover:translate-y-0"
      style={{ transformOrigin: "center bottom" }}
      onClick={onCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCardClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-visible rounded-xl border border-white/[0.06] bg-[#06080f] shadow-lg shadow-black/50 ring-1 ring-white/[0.03] transition-[box-shadow,border-color] duration-300 md:group-hover/card:border-white/15 md:group-hover/card:shadow-2xl md:group-hover/card:shadow-black/80 sm:rounded-2xl">
        <div className={`relative ${aspectClass} shrink-0 overflow-hidden rounded-t-xl sm:rounded-t-2xl`}>
          <img
            src={posterSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full transition duration-500 ease-out md:group-hover/card:scale-[1.03] ${imageObjectClass}`}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030406] via-transparent to-black/20"
            aria-hidden
          />
          {typeof rank === "number" ? (
            <span
              className="pointer-events-none absolute bottom-0 left-0 z-[1] translate-x-[-4%] translate-y-[18%] text-5xl font-black tabular-nums leading-none text-white/[0.18] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-6xl md:text-7xl"
              aria-hidden
            >
              {rank}
            </span>
          ) : null}
          {badge ? (
            <div className="pointer-events-none absolute left-2 top-2 z-[1] drop-shadow-md">{badge}</div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 z-[2] max-md:hidden translate-y-2 opacity-0 transition duration-300 ease-out md:pointer-events-none md:group-hover/card:pointer-events-auto md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100">
            <div className="rounded-b-xl bg-gradient-to-t from-black via-black/95 to-transparent px-3 pb-3 pt-16 sm:px-4 sm:pb-4 sm:pt-20">
              <div className="mb-2 flex items-stretch gap-2">
                <button
                  type="button"
                  className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black shadow-md transition hover:bg-zinc-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPlay(event);
                  }}
                >
                  <Play className="h-4 w-4 shrink-0 fill-black stroke-black" aria-hidden />
                  Watch now
                </button>
                <button
                  type="button"
                  className="flex min-h-10 w-11 shrink-0 items-center justify-center rounded-md border border-white/15 bg-zinc-800/95 text-white transition hover:bg-zinc-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCardClick();
                  }}
                  aria-label="Add to list"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
              {meta ? (
                <p className="mb-1.5 line-clamp-1 text-[11px] font-medium text-zinc-400">{meta}</p>
              ) : null}
              <p className="mb-2 line-clamp-4 text-[11px] leading-relaxed text-zinc-300 sm:text-xs">
                {description || "No description yet."}
              </p>
              {thumbs.length > 0 ? (
                <div className="mb-1 flex gap-1">
                  {thumbs.map((src, index) => (
                    <div key={`${src}-${index}`} className="min-w-0 flex-1">
                      <div className="aspect-video w-full overflow-hidden rounded border border-white/10 bg-black">
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between rounded-b-xl border-t border-white/[0.06] bg-gradient-to-b from-[#080c16] to-[#04060c] px-3 pb-3 pt-3 sm:rounded-b-2xl sm:px-4 sm:pb-4 sm:pt-4 md:flex-none md:justify-start md:py-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-white sm:text-sm md:text-lg">
              {title}
            </h3>
            <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500 sm:text-xs">{subtitle}</p>
          </div>
          <div
            className="flex gap-2 pt-2.5 sm:pt-3 md:hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Watch now"
              className="flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-2.5 text-xs font-semibold leading-tight text-black sm:min-h-11 sm:gap-2 sm:px-3 sm:text-sm"
              onClick={(event) => {
                event.stopPropagation();
                onPlay(event);
              }}
            >
              <Play className="h-3.5 w-3.5 shrink-0 fill-black stroke-black sm:h-4 sm:w-4" aria-hidden />
              <span className="sm:hidden">Play</span>
              <span className="hidden sm:inline">Watch now</span>
            </button>
            <button
              type="button"
              className="flex h-9 w-10 shrink-0 items-center justify-center rounded-md border border-white/15 bg-zinc-800 text-white sm:h-11 sm:w-12 sm:rounded-lg"
              onClick={(event) => {
                event.stopPropagation();
                onCardClick();
              }}
              aria-label="More info"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
