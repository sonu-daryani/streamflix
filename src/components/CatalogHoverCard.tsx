"use client";

import type { ReactNode } from "react";
import { Play, Plus } from "lucide-react";

type CatalogHoverCardProps = {
  posterSrc: string;
  title: string;
  subtitle: string;
  description: string;
  /** e.g. "2013 • Action • Hindi" — shown on hover like streaming apps */
  metaLine?: string;
  /** Portrait poster (2/3) or landscape (16/9) for live channels */
  aspect?: "poster" | "video";
  /** Small still previews (episode thumbs, etc.); max 4 shown in hover strip */
  previewThumbs?: string[];
  badge?: ReactNode;
  /** Large rank digit (Top 10 style), bottom-left over poster */
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
      className="group/card relative z-0 h-full cursor-pointer p-2 transition-[transform,box-shadow,z-index] duration-300 ease-out will-change-transform hover:z-25 hover:scale-[1.12] hover:-translate-y-6 focus-within:z-25 focus-within:scale-[1.12] focus-within:-translate-y-6 motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0"
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
      <div className="h-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#06080f] shadow-lg shadow-black/50 ring-1 ring-white/[0.03] transition-[box-shadow,border-color] duration-300 group-hover/card:border-white/15 group-hover/card:shadow-2xl group-hover/card:shadow-black/80 sm:rounded-2xl">
        <div className={`relative ${aspectClass} overflow-hidden`}>
          <img
            src={posterSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full transition duration-500 ease-out group-hover/card:scale-[1.03] ${imageObjectClass}`}
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

          {/* Hover panel — Hotstar-style: primary white CTA, dark +, meta, synopsis */}
          <div className="absolute inset-x-0 bottom-0 z-[2] max-md:hidden translate-y-2 opacity-0 transition duration-300 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 md:pointer-events-none md:group-hover/card:pointer-events-auto">
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

        <div className="border-t border-white/[0.06] bg-gradient-to-b from-[#080c16] to-[#04060c] px-3 py-3 sm:px-4 sm:py-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-white sm:text-base md:text-lg">
            {title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{subtitle}</p>
          <div
            className="mt-3 flex gap-2 md:hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black"
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
              className="flex min-h-11 w-12 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-zinc-800 text-white"
              onClick={(event) => {
                event.stopPropagation();
                onCardClick();
              }}
              aria-label="More info"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
