import type { ContentItem } from "@/lib/types";
import type { SeekThumbnailGridSheet } from "hls-react-player";

type WithThumb = {
  seekThumbnail?: string | SeekThumbnailGridSheet[];
  previewStoryboardVtt?: string;
};

export function itemSeekThumbnailSource(
  item: WithThumb,
): string | SeekThumbnailGridSheet[] | undefined {
  const st = item.seekThumbnail;
  if (Array.isArray(st) && st[0] && typeof st[0] === "object" && "spriteUrl" in st[0]) {
    return st;
  }
  const vtt = (typeof st === "string" && st.trim()) || item.previewStoryboardVtt?.trim();
  return vtt || undefined;
}

export function episodeSeekThumbnailSource(
  ep: NonNullable<ContentItem["episodes"]>[number],
  show: ContentItem,
): string | SeekThumbnailGridSheet[] | undefined {
  return itemSeekThumbnailSource(ep) ?? itemSeekThumbnailSource(show);
}
