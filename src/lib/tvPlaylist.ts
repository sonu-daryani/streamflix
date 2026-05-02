import crypto from "crypto";
import type { DrmConfig, StreamType } from "@/lib/types";

type RawChannel = {
  id: string;
  sourceId?: string;
  title: string;
  logo: string;
  group: string;
  streamUrl: string;
  streamType: StreamType;
  drm?: DrmConfig;
};

const PLAYLIST_PATH = "https://public-stream.vercel.app/tv.m3u";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { expiresAt: number; channels: RawChannel[] } | null = null;
let inflight: Promise<RawChannel[]> | null = null;

const parseAttrs = (line: string) => {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
  let match = regex.exec(line);
  while (match) {
    attrs[match[1]] = match[2];
    match = regex.exec(line);
  }
  return attrs;
};

export const getTvChannels = async () => {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.channels;
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const response = await fetch(PLAYLIST_PATH, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        throw new Error(`Playlist fetch failed with status ${response.status}`);
      }
      const body = await response.text();
      const lines = body.split("\n").map((line) => line.trim());
      const channels: RawChannel[] = [];

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (!line.startsWith("#EXTINF")) continue;
        const attrs = parseAttrs(line);
        const title = line.includes(",") ? line.split(",").pop()?.trim() || "Live TV" : "Live TV";
        let streamUrl = "";

        // Skip metadata lines and pick the next direct URL line.
        for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
          const candidate = lines[cursor];
          if (!candidate) continue;
          if (candidate.startsWith("#EXTINF")) break;
          if (candidate.startsWith("#")) continue;
          streamUrl = candidate.split("|")[0]?.trim() || "";
          break;
        }

        if (!streamUrl) continue;

        try {
          const parsed = new URL(streamUrl);
          if (!["http:", "https:"].includes(parsed.protocol)) continue;
        } catch {
          continue;
        }

        const id = crypto.createHash("sha256").update(streamUrl).digest("hex").slice(0, 24);
        const lower = streamUrl.toLowerCase();
        const streamType: StreamType =
          lower.includes(".m3u8") || lower.endsWith(".m3u") ? "hls" : lower.endsWith(".mpd") ? "mpd" : "mp4";
        channels.push({
          id,
          sourceId: attrs["tvg-id"]?.trim() || undefined,
          title,
          logo: attrs["tvg-logo"] || "",
          group: attrs["group-title"] || "Live",
          streamUrl,
          streamType,
        });
      }

      cache = {
        channels,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return channels;
    } catch {
      // Prefer stale cache over hard failures.
      if (cache) return cache.channels;
      return [];
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};
