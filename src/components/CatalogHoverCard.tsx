"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { ChevronDown, Info, Play, Plus, ThumbsUp } from "lucide-react";

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
  /** Rich Netflix-style hover sheet (desktop) */
  hoverStyle?: "default" | "netflix";
  /** Pills anchored to the bottom of the poster (e.g. New Episode | Play) */
  posterBottomSlot?: ReactNode;
  /** Deterministic or CMS-provided match label */
  matchPercent?: number;
  maturityRating?: string;
  seasonsLabel?: string;
  genresLine?: string;
  /** Hide the title/meta footer under the poster (landscape rows) */
  hideFooter?: boolean;
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
  hoverStyle = "default",
  posterBottomSlot,
  matchPercent = 78,
  maturityRating = "U/A 16+",
  seasonsLabel,
  genresLine,
  hideFooter = false,
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
  const netflixHover = hoverStyle === "netflix";
  const genreText =
    genresLine ||
    subtitle
      .split("•")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" • ");

  const posterClipRounded = netflixHover
    ? hideFooter
      ? "rounded-sm sm:rounded-md"
      : "rounded-t-sm sm:rounded-t-md"
    : "rounded-t-xl sm:rounded-t-2xl";

  const posterCore = (
    <>
      <img
        src={posterSrc}
        alt=""
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full transition duration-500 ease-out md:group-hover/card:scale-[1.02] ${imageObjectClass}`}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-black via-black/55 to-transparent sm:h-20"
        aria-hidden
      />
      {typeof rank === "number" && !netflixHover ? (
        <span
          className="pointer-events-none absolute bottom-0 left-0 z-[1] translate-x-[-4%] translate-y-[18%] text-5xl font-black tabular-nums leading-none text-white/[0.18] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-6xl md:text-7xl"
          aria-hidden
        >
          {rank}
        </span>
      ) : null}
      {badge ? (
        <div className="pointer-events-none absolute left-2 top-2 z-[2] drop-shadow-md">{badge}</div>
      ) : null}
      {posterBottomSlot ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center px-1.5 pb-2 sm:px-2 sm:pb-2.5">
          {posterBottomSlot}
        </div>
      ) : null}
    </>
  );

  const netflixHoverSheet = (
    <div
      className="absolute inset-x-0 bottom-0 z-[3] max-md:hidden translate-y-1 opacity-0 transition duration-300 ease-out md:pointer-events-none md:group-hover/card:pointer-events-auto md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100"
    >
      <div className="rounded-b-sm border border-white/[0.08] border-t-0 bg-[#181818] px-2.5 pb-2.5 pt-2.5 shadow-[0_-18px_50px_rgba(0,0,0,0.75)] sm:rounded-b-md sm:px-3 sm:pb-3 sm:pt-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white text-black shadow-md transition hover:bg-zinc-100"
            onClick={(event) => {
              event.stopPropagation();
              onPlay(event);
            }}
            aria-label={`Play ${title}`}
          >
            <Play className="ml-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" strokeWidth={0} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/35 bg-[#2a2a2a]/90 text-white transition hover:border-white/55 hover:bg-[#333]"
            aria-label="Add to list"
            onClick={(event) => event.stopPropagation()}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/35 bg-[#2a2a2a]/90 text-white transition hover:border-white/55 hover:bg-[#333]"
            aria-label="Like"
            onClick={(event) => event.stopPropagation()}
          >
            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/35 bg-[#2a2a2a]/90 text-white transition hover:border-white/55 hover:bg-[#333]"
            aria-label={detailsLabel}
            onClick={(event) => {
              event.stopPropagation();
              onCardClick();
            }}
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-200 sm:mt-2.5 sm:gap-2 sm:text-xs">
          <span className="font-semibold text-emerald-400">{matchPercent}% match</span>
          <span className="rounded border border-white/25 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-100">
            {maturityRating}
          </span>
          {seasonsLabel ? <span className="text-zinc-300">{seasonsLabel}</span> : null}
          <span className="rounded border border-white/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-200">
            HD
          </span>
        </div>
        {genreText ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-zinc-400 sm:text-xs">{genreText}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <article
      aria-labelledby={titleId}
      className={`group/card relative z-0 flex h-full min-h-0 w-full min-w-0 flex-1 cursor-pointer flex-col transition-[transform,box-shadow,z-index] duration-300 ease-out will-change-transform focus-visible:outline-none md:will-change-transform md:hover:z-25 md:hover:scale-[1.03] md:hover:-translate-y-2 md:focus-visible:z-25 md:focus-visible:ring-2 md:focus-visible:ring-[color:rgba(229,9,20,0.55)] md:focus-visible:ring-offset-2 md:focus-visible:ring-offset-black md:focus-within:z-25 md:focus-within:scale-[1.03] md:focus-within:-translate-y-2 lg:hover:scale-[1.04] lg:hover:-translate-y-3 lg:focus-within:scale-[1.04] lg:focus-within:-translate-y-3 motion-reduce:md:hover:scale-100 motion-reduce:md:hover:translate-y-0 ${cozy ? "p-1.5 sm:p-2 md:p-2.5" : "p-1 sm:p-1.5 md:p-2"}`}
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
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-visible rounded-sm border border-white/[0.08] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.04] transition-[box-shadow,border-color] duration-300 md:group-hover/card:border-white/16 md:group-hover/card:shadow-[0_24px_60px_rgba(0,0,0,0.85)] ${
          netflixHover ? "sm:rounded-md" : "rounded-xl sm:rounded-2xl"
        }`}
      >
        {netflixHover ? (
          <div
            className={`relative ${aspectClass} shrink-0 overflow-hidden md:overflow-visible ${posterClipRounded}`}
          >
            <div className={`absolute inset-0 overflow-hidden ${posterClipRounded}`}>{posterCore}</div>
            {netflixHoverSheet}
          </div>
        ) : (
          <div className={`relative ${aspectClass} shrink-0 overflow-hidden ${posterClipRounded}`}>
            {posterCore}
            {/* Desktop hover sheet */}
            <div className="absolute inset-x-0 bottom-0 z-[3] max-md:hidden translate-y-1 opacity-0 transition duration-300 ease-out md:pointer-events-none md:group-hover/card:pointer-events-auto md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100">
              <div className="rounded-b-xl border border-white/[0.07] border-t-0 bg-zinc-950/85 px-3 pb-3 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:rounded-b-2xl sm:px-3.5 sm:pb-3.5 sm:pt-3.5">
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
        )}

        {hideFooter ? null : (
          <div
            className={`flex min-h-0 flex-1 flex-col justify-between rounded-b-sm bg-black sm:rounded-b-md md:flex-none md:justify-start md:py-4 ${cozy ? "gap-3 px-3 pb-4 pt-3 sm:px-3.5 sm:pb-5 sm:pt-3" : "px-3 pb-3 pt-3 sm:px-3.5 sm:pb-3.5 sm:pt-3.5"} ${netflixHover ? "" : "rounded-b-xl bg-[var(--surface-card-footer)] sm:rounded-b-2xl"}`}
          >
            <div className={`min-w-0 ${cozy ? "min-h-[5rem]" : ""}`}>
              <h3
                id={titleId}
                className={`line-clamp-2 font-semibold leading-snug tracking-tight text-white ${cozy ? "text-sm sm:text-base md:text-lg" : "text-xs sm:text-sm md:text-lg"}`}
              >
                {title}
              </h3>
              <p
                className={`mt-1.5 line-clamp-2 leading-snug text-zinc-400 ${cozy ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"}`}
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
        )}
      </div>
    </article>
  );
}
