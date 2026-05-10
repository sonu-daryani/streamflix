"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { Info, Play } from "lucide-react";

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
  /** Slightly larger type and spacing — optimized for homepage rails */
  density?: "default" | "cozy";
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
  density = "default",
  onCardClick,
  onPlay,
}: CatalogHoverCardProps) {
  const titleId = useId();
  const aspectClass = aspect === "video" ? "aspect-[16/9]" : "aspect-[2/3]";
  const isVideo = aspect === "video";
  const thumbs = previewThumbs.filter(Boolean).slice(0, 4);
  const meta = metaLine ?? subtitle;

  const imageObjectClass = isVideo
    ? "object-cover object-center"
    : "object-cover object-top";

  const detailsLabel = `Details: ${title}`;
  const cozy = density === "cozy";
  const thumbShow = thumbs.slice(0, 3);

  return (
    <article
      aria-labelledby={titleId}
      className={`group/card relative z-0 flex h-full min-h-0 w-full min-w-0 flex-1 cursor-pointer flex-col transition-[transform,box-shadow,z-index] duration-300 ease-out will-change-transform focus-visible:outline-none md:will-change-transform md:hover:z-25 md:hover:scale-[1.03] md:hover:-translate-y-2 md:focus-visible:z-25 md:focus-visible:ring-2 md:focus-visible:ring-[color:rgba(229,9,20,0.55)] md:focus-visible:ring-offset-2 md:focus-visible:ring-offset-[#121212] md:focus-within:z-25 md:focus-within:scale-[1.03] md:focus-within:-translate-y-2 lg:hover:scale-[1.04] lg:hover:-translate-y-3 lg:focus-within:scale-[1.04] lg:focus-within:-translate-y-3 motion-reduce:md:hover:scale-100 motion-reduce:md:hover:translate-y-0 ${cozy ? "p-1.5 sm:p-2 md:p-2.5" : "p-1 sm:p-1.5 md:p-2"}`}
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
      <div className="flex min-h-0 flex-1 flex-col overflow-visible rounded-xl border border-white/[0.09] bg-[var(--surface-card)] shadow-lg shadow-black/55 ring-1 ring-white/[0.06] transition-[box-shadow,border-color] duration-300 md:group-hover/card:border-white/18 md:group-hover/card:shadow-xl md:group-hover/card:shadow-black/70 sm:rounded-2xl">
        <div className={`relative ${aspectClass} shrink-0 overflow-hidden rounded-t-xl sm:rounded-t-2xl`}>
          <img
            src={posterSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full transition duration-500 ease-out md:group-hover/card:scale-[1.02] ${imageObjectClass}`}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"
            aria-hidden
          />
          {/* Soft blend into the footer — avoids a harsh cut line */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-transparent sm:h-16"
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

          {/* Desktop / tablet: compact hover sheet — fewer lines + fewer thumbs so it stays scannable */}
          <div className="absolute inset-x-0 bottom-0 z-[2] max-md:hidden translate-y-1 opacity-0 transition duration-300 ease-out md:pointer-events-none md:group-hover/card:pointer-events-auto md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100">
            <div className="rounded-b-xl border border-white/[0.07] border-t-0 bg-zinc-950/85 px-3 pb-3 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:px-3.5 sm:pb-3.5 sm:pt-3.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-primary flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 !rounded-xl px-3 py-2 text-sm font-semibold shadow-md"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPlay(event);
                  }}
                >
                  <Play className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
                  Play
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/35 bg-black/45 text-white shadow-lg backdrop-blur-sm transition hover:border-white/55 hover:bg-black/60"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCardClick();
                  }}
                  aria-label={detailsLabel}
                >
                  <Info className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
                </button>
              </div>
              {meta ? (
                <p className="mt-2 line-clamp-1 text-xs font-medium text-zinc-300">{meta}</p>
              ) : null}
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-zinc-100">
                {description || "No description yet."}
              </p>
              {thumbShow.length > 0 ? (
                <div className="mt-2.5 flex gap-1.5">
                  {thumbShow.map((src, index) => (
                    <div key={`${src}-${index}`} className="min-w-0 flex-1">
                      <div className="aspect-video h-9 w-full overflow-hidden rounded-md border border-white/15 bg-black sm:h-10">
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

        <div
          className={`flex min-h-0 flex-1 flex-col justify-between rounded-b-xl bg-[var(--surface-card-footer)] sm:rounded-b-2xl md:flex-none md:justify-start md:py-4 ${cozy ? "gap-3 px-4 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-4" : "px-3.5 pb-4 pt-3.5 sm:px-4 sm:pb-4 sm:pt-4"}`}
        >
          <div className={`min-w-0 ${cozy ? "min-h-[4.5rem]" : ""}`}>
            <h3
              id={titleId}
              className={`line-clamp-2 font-semibold leading-snug tracking-tight text-white ${cozy ? "text-sm sm:text-base md:text-lg" : "text-xs sm:text-sm md:text-lg"}`}
            >
              {title}
            </h3>
            <p
              className={`mt-1.5 line-clamp-2 leading-snug text-zinc-300 ${cozy ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"}`}
            >
              {subtitle}
            </p>
          </div>
          <div
            className={`grid grid-cols-2 gap-2 sm:gap-2.5 md:hidden ${cozy ? "pt-1.5" : "pt-3 sm:pt-3.5"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="btn-primary flex min-h-12 w-full min-w-0 items-center justify-center gap-2 !rounded-xl px-2 py-2.5 text-sm font-semibold shadow-md"
              onClick={(event) => {
                event.stopPropagation();
                onPlay(event);
              }}
            >
              <Play className="h-[1.05rem] w-[1.05rem] shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
              <span>Play</span>
            </button>
            <button
              type="button"
              className="btn-card-quiet w-full min-w-0 text-sm"
              onClick={(event) => {
                event.stopPropagation();
                onCardClick();
              }}
              aria-label={detailsLabel}
            >
              <Info className="h-[1.05rem] w-[1.05rem] shrink-0" strokeWidth={2.25} aria-hidden />
              <span>Info</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
