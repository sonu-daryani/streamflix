import type { ContentItem } from "@/lib/types";

/** Stable pseudo “match %” for card hover UI from catalog id */
export function catalogMatchPercent(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return 68 + (sum % 28);
}

export function catalogSeasonsLabel(item: ContentItem): string | undefined {
  if (item.episodes?.length) {
    const seasonCount = Math.max(
      new Set(item.episodes.map((e) => e.seasonTitle || "Season 1")).size,
      1,
    );
    return `${seasonCount} Season${seasonCount === 1 ? "" : "s"}`;
  }
  if ((item.category || "").trim().toLowerCase() === "movie") return "Movie";
  return "1 Season";
}
