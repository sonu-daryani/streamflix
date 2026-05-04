/**
 * Loads catalog items from MX Player–style APIs when reachable, then writes them to MongoDB.
 * TV shows: walks `tabs[].containers` (seasons) and paginates `detail/tab/tvshowepisodes` so all
 * episodes with stream URLs are stored on each series document.
 * If remote APIs fail or return nothing, inserts a built‑in demo catalog (same shape as the app).
 *
 * Usage: `npm run seed:mx` (requires MONGODB_URI).
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import path from "path";
import type { Collection } from "mongodb";
import type { CatalogDocument } from "../src/lib/catalogStore";
import type { ContentItem, StreamType } from "../src/lib/types";
import { CATALOG_COLLECTION, getDb } from "../src/lib/mongo";

const USER_ID = process.env.MX_USER_ID ?? "30bb09af-733a-413b-b8b7-b10348ec2b3d";
const CONTENT_LANG =
  process.env.MX_CONTENT_LANGUAGES ?? "en,hi,ta,te,mr,bn,gu,kn,ml,pa";

const TARGET_MOVIES = Number(process.env.MX_TARGET_MOVIES ?? "80");
const TARGET_TV = Number(process.env.MX_TARGET_TVSHOWS ?? "40");
const MAX_PAGES = Number(process.env.MX_MAX_PAGES ?? "40");
const HOME_PAGE_SIZE = Number(process.env.MX_HOME_PAGE_SIZE ?? "50");
/** Episodes list API (`detail/tab/tvshowepisodes`) */
const EPISODE_PAGE_SIZE = Number(process.env.MX_EPISODE_PAGE_SIZE ?? "100");
const EPISODE_LIST_MAX_PAGES = Number(process.env.MX_EPISODE_LIST_MAX_PAGES ?? "80");
const MAX_EPISODES_PER_SHOW = Number(process.env.MX_MAX_EPISODES_PER_SHOW ?? "2000");
const EPISODE_FETCH_DELAY_MS = Number(process.env.MX_EPISODE_FETCH_DELAY_MS ?? "45");

const ASSET_BASE = process.env.MX_ASSET_BASE_URL?.replace(/\/$/, "") ?? "";
/** CDN prefix for relative paths under `stream.hls` / `stream.dash` */
const STREAM_BASE = (
  process.env.MX_STREAM_BASE_URL ?? "https://d3sgzbosmwirao.cloudfront.net"
).replace(/\/$/, "");

function resolveAssetUrl(maybeRelative: string): string {
  const t = maybeRelative.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("//")) return `https:${t}`;
  if (ASSET_BASE) return `${ASSET_BASE}${t.startsWith("/") ? "" : "/"}${t}`;
  return t;
}

function inferStreamType(url: string): StreamType {
  const u = url.toLowerCase();
  if (u.includes(".m3u8") || u.includes(".m3u")) return "hls";
  if (u.includes(".mpd")) return "mpd";
  return "mp4";
}

function getMxApiOrigin(): string {
  const tab = process.env.MX_HOME_TAB_URL;
  if (tab) {
    try {
      return new URL(tab).origin;
    } catch {
      /* ignore */
    }
  }
  return "https://api.mxplayer.in";
}

function getMxDetailQueryDefaults(): URLSearchParams {
  const defaults = new URLSearchParams();
  defaults.set("platform", "com.mxplay.desktop");
  defaults.set("device-density", "3");
  defaults.set("userid", USER_ID);
  defaults.set("content-languages", CONTENT_LANG);

  const tab = process.env.MX_HOME_TAB_URL;
  if (tab) {
    try {
      const u = new URL(tab);
      for (const key of [
        "userid",
        "platform",
        "device-density",
        "content-languages",
        "kids-mode-enabled",
      ] as const) {
        const v = u.searchParams.get(key);
        if (v) defaults.set(key, v);
      }
    } catch {
      /* ignore */
    }
  }
  return defaults;
}

function buildMxDetailUrl(apiType: string, id: string): string {
  const origin = getMxApiOrigin();
  const u = new URL(`${origin}/v1/web/detail/video`);
  u.searchParams.set("type", apiType);
  u.searchParams.set("id", id);
  getMxDetailQueryDefaults().forEach((value, key) => {
    if (!u.searchParams.has(key)) {
      u.searchParams.set(key, value);
    }
  });
  return u.toString();
}

function unwrapMxDetailPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const top = raw as Record<string, unknown>;
  if (top.data && typeof top.data === "object") {
    return top.data as Record<string, unknown>;
  }
  return top;
}

function resolveMxStreamPath(pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${STREAM_BASE}/${p.replace(/^\//, "")}`;
}

/**
 * MX embeds HLS/DASH as CDN-relative paths under `stream`, not as plain https strings.
 */
function extractHlsFromStreamNode(stream: unknown): string | null {
  if (!stream || typeof stream !== "object") return null;
  const s = stream as Record<string, unknown>;

  const tryHlsBlock = (block: unknown): string | null => {
    if (!block || typeof block !== "object") return null;
    const b = block as Record<string, unknown>;
    for (const key of ["high", "main", "base"] as const) {
      const v = b[key];
      if (typeof v === "string" && v.length > 4) {
        return resolveMxStreamPath(v);
      }
    }
    return null;
  };

  const direct = tryHlsBlock(s.hls);
  if (direct) return direct;

  const mxplay = s.mxplay;
  if (mxplay && typeof mxplay === "object") {
    const nested = tryHlsBlock((mxplay as Record<string, unknown>).hls);
    if (nested) return nested;
  }

  const thirdParty = s.thirdParty;
  if (thirdParty && typeof thirdParty === "object") {
    const tp = thirdParty as Record<string, unknown>;
    const hlsUrl = tp.hlsUrl;
    if (typeof hlsUrl === "string" && hlsUrl.length > 4) {
      return resolveMxStreamPath(hlsUrl);
    }
  }

  return null;
}

function extractPlaybackFromDetailRoot(root: Record<string, unknown>): string | null {
  const fromStream = extractHlsFromStreamNode(root.stream);
  if (fromStream) return fromStream;
  return findStreamUrl(root);
}

/**
 * Home-tab JSON includes many nodes with `type` (e.g. image bigpic). Only treat rows that look
 * like catalog titles: movie / tvshow with id + title.
 */
function extractMxContentCards(root: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const o = node as Record<string, unknown>;
    const rawId = o.id;
    const idStr =
      typeof rawId === "string"
        ? rawId
        : typeof rawId === "number" && Number.isFinite(rawId)
          ? String(rawId)
          : "";
    const rawType = typeof o.type === "string" ? o.type.toLowerCase() : "";

    if (
      idStr.length >= 8 &&
      typeof o.title === "string" &&
      o.title.trim().length > 0 &&
      (rawType === "movie" || rawType === "tvshow")
    ) {
      const key = `${rawType}:${idStr}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(o);
      }
    }
    for (const k of Object.keys(o)) walk(o[k]);
  };

  walk(root);
  return out;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      accept: "application/json",
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json() as Promise<unknown>;
}

function findStreamUrl(node: unknown, depth = 0): string | null {
  if (depth > 24) return null;
  if (typeof node === "string") {
    const s = node.trim();
    if (
      (s.startsWith("http://") || s.startsWith("https://")) &&
      (s.includes(".m3u8") || s.includes(".m3u") || s.includes(".mpd") || s.includes(".mp4"))
    ) {
      return s;
    }
    if (
      (s.startsWith("http://") || s.startsWith("https://")) &&
      s.includes("/") &&
      (s.includes("m3u8") || s.includes(".mpd"))
    ) {
      return s;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const x of node) {
      const u = findStreamUrl(x, depth + 1);
      if (u) return u;
    }
    return null;
  }
  for (const v of Object.values(node)) {
    const u = findStreamUrl(v, depth + 1);
    if (u) return u;
  }
  return null;
}

function pickPoster(detail: Record<string, unknown>): string {
  const imageInfo = detail.imageInfo;
  if (Array.isArray(imageInfo)) {
    for (const img of imageInfo) {
      if (img && typeof img === "object" && "url" in img && typeof (img as { url: string }).url === "string") {
        return resolveAssetUrl((img as { url: string }).url);
      }
    }
  }
  const poster = detail.poster ?? detail.thumbnail ?? detail.image;
  if (typeof poster === "string") return resolveAssetUrl(poster);
  return "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=800&q=80";
}

function pickYear(detail: Record<string, unknown>): number {
  const raw =
    (detail.releaseDate as string | undefined) ??
    (detail.releaseYear as string | undefined) ??
    (detail.year as number | undefined);
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const m = raw.match(/(\d{4})/);
    if (m) return Number(m[1]);
  }
  return new Date().getFullYear();
}

function pickGenre(detail: Record<string, unknown>): string {
  const g = detail.genre;
  if (Array.isArray(detail.genres) && detail.genres.length) {
    const first = detail.genres[0];
    if (typeof first === "string") return first;
  }
  if (Array.isArray(g) && g.length && typeof g[0] === "string") return g[0];
  if (typeof g === "string") return g;
  return "Drama";
}

async function fetchMxVideoDetailRaw(
  apiType: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  const url = buildMxDetailUrl(apiType, id);
  let detailRaw: unknown;
  try {
    detailRaw = await fetchJson(url);
  } catch {
    return null;
  }
  const root = unwrapMxDetailPayload(detailRaw);
  if (!root || typeof root !== "object") return null;
  const sc = root.statusCode;
  if (typeof sc === "number" && sc !== 1000) return null;
  return root;
}

type TvShowEpisodesTabInfo = {
  containers: Record<string, unknown>[];
  /** Episode id used as `filterId` for the tab API */
  filterId: string;
};

function getTvShowEpisodesTabFromEpisodeDetail(
  episodeDetail: Record<string, unknown>,
): TvShowEpisodesTabInfo | null {
  const filterId =
    typeof episodeDetail.id === "string"
      ? episodeDetail.id
      : typeof episodeDetail.id === "number"
        ? String(episodeDetail.id)
        : "";
  if (!filterId) return null;

  const tabs = episodeDetail.tabs;
  if (!Array.isArray(tabs)) return null;

  for (const raw of tabs) {
    if (!raw || typeof raw !== "object") continue;
    const tab = raw as Record<string, unknown>;
    const tabType = typeof tab.type === "string" ? tab.type : "";
    const api = typeof tab.api === "string" ? tab.api : "";
    const isEpisodesTab =
      tabType === "tvshowepisodes" ||
      api.includes("tvshowepisodes") ||
      api.includes("detail/tab/tvshowepisodes");
    if (!isEpisodesTab) continue;

    const containers = tab.containers;
    if (!Array.isArray(containers) || containers.length === 0) continue;

    const normalized = containers.filter((c): c is Record<string, unknown> => Boolean(c && typeof c === "object"));
    if (normalized.length === 0) continue;

    return { containers: normalized, filterId };
  }

  return null;
}

function buildMxTvShowEpisodesUrl(opts: { seasonId: string; filterId: string; cursor?: string | null }): string {
  const origin = getMxApiOrigin();
  const u = new URL(`${origin}/v1/web/detail/tab/tvshowepisodes`);
  u.searchParams.set("type", "season");
  u.searchParams.set("id", opts.seasonId);
  u.searchParams.set("filterId", opts.filterId);
  u.searchParams.set("pageNo", "1");
  u.searchParams.set("pageSize", String(EPISODE_PAGE_SIZE));
  if (opts.cursor?.trim()) {
    const extra = new URLSearchParams(opts.cursor.trim());
    extra.forEach((value, key) => {
      u.searchParams.set(key, value);
    });
  }
  getMxDetailQueryDefaults().forEach((value, key) => {
    if (!u.searchParams.has(key)) {
      u.searchParams.set(key, value);
    }
  });
  return u.toString();
}

async function fetchAllEpisodeRowsForSeason(
  seasonId: string,
  filterId: string,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < EPISODE_LIST_MAX_PAGES; page += 1) {
    if (rows.length >= MAX_EPISODES_PER_SHOW) break;

    const url = buildMxTvShowEpisodesUrl({ seasonId, filterId, cursor });
    let json: unknown;
    try {
      json = await fetchJson(url);
    } catch {
      break;
    }

    const payload = json as Record<string, unknown>;
    const items = payload.items;
    if (!Array.isArray(items) || items.length === 0) break;

    for (const it of items) {
      if (it && typeof it === "object") {
        rows.push(it as Record<string, unknown>);
        if (rows.length >= MAX_EPISODES_PER_SHOW) break;
      }
    }

    const nextRaw = payload.next;
    const next = typeof nextRaw === "string" && nextRaw.trim() ? nextRaw.trim() : null;
    if (!next) break;
    cursor = next;
    await sleep(EPISODE_FETCH_DELAY_MS);
  }

  return rows;
}

function mapMxEpisodeRowToEpisode(
  row: Record<string, unknown>,
  seasonTitle: string,
  yearFallback: number,
): NonNullable<ContentItem["episodes"]>[number] | null {
  const streamUrl = extractPlaybackFromDetailRoot(row);
  if (!streamUrl) return null;
  const id =
    typeof row.id === "string" ? row.id : typeof row.id === "number" ? String(row.id) : randomUUID();
  const seq =
    typeof row.sequence === "number" && row.sequence > 0 ? row.sequence : 1;

  return {
    id,
    title: typeof row.title === "string" ? row.title : "Episode",
    description: typeof row.description === "string" ? row.description : "",
    episodeNumber: seq,
    seasonTitle,
    streamUrl,
    streamType: inferStreamType(streamUrl),
    posterSrc: pickPoster(row),
    year: pickYear(row) || yearFallback,
  };
}

function pickCardPoster(card: Record<string, unknown>): string {
  if (Array.isArray(card.imageInfo) && card.imageInfo[0] && typeof card.imageInfo[0] === "object") {
    const u = (card.imageInfo[0] as { url?: string }).url;
    if (typeof u === "string") return resolveAssetUrl(u);
  }
  return pickPoster(card);
}

async function buildContentItemFromMxCard(
  card: Record<string, unknown>,
): Promise<ContentItem | null> {
  const idStr =
    typeof card.id === "string"
      ? card.id
      : typeof card.id === "number"
        ? String(card.id)
        : "";
  const cardType = typeof card.type === "string" ? card.type.toLowerCase() : "";
  if (!idStr || (cardType !== "movie" && cardType !== "tvshow")) return null;

  const cardTitle = typeof card.title === "string" ? card.title : "Untitled";
  const cardDesc =
    typeof card.description === "string"
      ? card.description
      : "Imported from MX Player catalog.";
  const posterFallback = pickCardPoster(card);
  const genresArr = card.genres;
  const genreQuick =
    Array.isArray(genresArr) && typeof genresArr[0] === "string"
      ? genresArr[0]
      : pickGenre(card);

  if (cardType === "movie") {
    const detail = await fetchMxVideoDetailRaw("movie", idStr);
    if (!detail) return null;
    const streamUrl = extractPlaybackFromDetailRoot(detail);
    if (!streamUrl) return null;
    const streamType = inferStreamType(streamUrl);
    return {
      id: idStr,
      title: typeof detail.title === "string" ? detail.title : cardTitle,
      description: typeof detail.description === "string" ? detail.description : cardDesc,
      category: "movie",
      genre: pickGenre(detail) || genreQuick,
      year: pickYear(detail),
      featured: false,
      posterSrc: posterFallback,
      streamUrl,
      streamType,
    };
  }

  const fv = card.firstVideo;
  if (!fv || typeof fv !== "object") return null;
  const epRef = fv as Record<string, unknown>;
  const epId =
    typeof epRef.id === "string"
      ? epRef.id
      : typeof epRef.id === "number"
        ? String(epRef.id)
        : "";
  const epTypeRaw =
    typeof epRef.type === "string" ? epRef.type.toLowerCase() : "episode";
  if (!epId) return null;

  const seedEpisodeDetail = await fetchMxVideoDetailRaw(epTypeRaw, epId);
  if (!seedEpisodeDetail) return null;

  const yearFallback = pickYear(card);
  const episodesTab = getTvShowEpisodesTabFromEpisodeDetail(seedEpisodeDetail);
  const episodes: NonNullable<ContentItem["episodes"]> = [];
  const seenEpIds = new Set<string>();

  if (episodesTab) {
    const seasons = [...episodesTab.containers].sort((a, b) => {
      const sa = typeof a.sequence === "number" ? a.sequence : 0;
      const sb = typeof b.sequence === "number" ? b.sequence : 0;
      return sa - sb;
    });

    for (const season of seasons) {
      const seasonId =
        typeof season.id === "string"
          ? season.id
          : typeof season.id === "number"
            ? String(season.id)
            : "";
      if (!seasonId) continue;

      const seasonTitle =
        typeof season.title === "string" ? season.title : undefined;

      const rows = await fetchAllEpisodeRowsForSeason(seasonId, episodesTab.filterId);
      await sleep(EPISODE_FETCH_DELAY_MS);

      for (const row of rows) {
        const ep = mapMxEpisodeRowToEpisode(row, seasonTitle ?? "Season", yearFallback);
        if (!ep || seenEpIds.has(ep.id)) continue;
        seenEpIds.add(ep.id);
        episodes.push(ep);
        if (episodes.length >= MAX_EPISODES_PER_SHOW) break;
      }

      if (episodes.length >= MAX_EPISODES_PER_SHOW) break;
    }
  }

  if (episodes.length === 0) {
    const streamUrl = extractPlaybackFromDetailRoot(seedEpisodeDetail);
    if (!streamUrl) return null;
    const streamType = inferStreamType(streamUrl);

    const container = seedEpisodeDetail.container;
    let seasonTitle: string | undefined;
    if (container && typeof container === "object") {
      const ct = (container as Record<string, unknown>).title;
      if (typeof ct === "string") seasonTitle = ct;
    }

    const epNum =
      typeof seedEpisodeDetail.sequence === "number" && seedEpisodeDetail.sequence > 0
        ? seedEpisodeDetail.sequence
        : 1;

    episodes.push({
      id: epId,
      title:
        typeof seedEpisodeDetail.title === "string"
          ? seedEpisodeDetail.title
          : "Episode 1",
      description:
        typeof seedEpisodeDetail.description === "string"
          ? seedEpisodeDetail.description
          : cardDesc,
      episodeNumber: epNum,
      seasonTitle,
      streamUrl,
      streamType,
      posterSrc: pickPoster(seedEpisodeDetail),
      year: pickYear(seedEpisodeDetail),
    });
  }

  episodes.sort((a, b) => {
    const sa = (a.seasonTitle ?? "").localeCompare(b.seasonTitle ?? "");
    if (sa !== 0) return sa;
    return a.episodeNumber - b.episodeNumber;
  });

  const primaryStream = episodes[0]?.streamUrl;
  const primaryType = episodes[0]?.streamType;
  if (!primaryStream || !primaryType) return null;

  return {
    id: idStr,
    title: cardTitle,
    description: cardDesc,
    category: "tvshow",
    genre: genreQuick,
    year: yearFallback,
    featured: false,
    posterSrc: posterFallback,
    streamUrl: primaryStream,
    streamType: primaryType,
    episodes,
  };
}

function toDocument(item: ContentItem): CatalogDocument {
  const id = item.id && item.id.length > 0 ? item.id : randomUUID();
  const { id: _drop, ...rest } = item;
  return { _id: id, ...rest };
}

async function fetchItemsFromHomeTab(): Promise<ContentItem[]> {
  const tabUrl = process.env.MX_HOME_TAB_URL;
  if (!tabUrl) return [];

  const items: ContentItem[] = [];
  const seenIds = new Set<string>();
  let movieCount = 0;
  let showCount = 0;

  pageLoop: for (let page = 0; page < MAX_PAGES; page += 1) {
    if (movieCount >= TARGET_MOVIES && showCount >= TARGET_TV) break;

    const pageUrl = new URL(tabUrl);
    pageUrl.searchParams.set("pageNo", String(page + 1));
    pageUrl.searchParams.set("pageSize", String(HOME_PAGE_SIZE));

    let json: unknown;
    try {
      json = await fetchJson(pageUrl.toString());
    } catch {
      break;
    }

    const cards = extractMxContentCards(json);
    if (cards.length === 0 && page === 0) {
      break;
    }

    for (const card of cards) {
      if (movieCount >= TARGET_MOVIES && showCount >= TARGET_TV) break pageLoop;

      const cid =
        typeof card.id === "string"
          ? card.id
          : typeof card.id === "number"
            ? String(card.id)
            : "";
      const ctype = typeof card.type === "string" ? card.type.toLowerCase() : "";
      if (!cid || (ctype !== "movie" && ctype !== "tvshow")) continue;
      if (seenIds.has(cid)) continue;

      if (ctype === "movie" && movieCount >= TARGET_MOVIES) continue;
      if (ctype === "tvshow" && showCount >= TARGET_TV) continue;

      const row = await buildContentItemFromMxCard(card);
      if (!row) continue;

      seenIds.add(cid);
      items.push(row);
      if (ctype === "movie") movieCount += 1;
      else showCount += 1;
      await sleep(80);
    }

    if (cards.length < HOME_PAGE_SIZE) break;
  }

  return dedupeAndFixFeatured(items);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function dedupeAndFixFeatured(items: ContentItem[]): ContentItem[] {
  const byKey = new Map<string, ContentItem>();
  for (const item of items) {
    if (!byKey.has(item.id)) byKey.set(item.id, item);
  }
  const list = Array.from(byKey.values());
  if (list.length === 0) return list;
  list[0] = { ...list[0], featured: true };
  return list;
}

function fallbackCatalog(): ContentItem[] {
  const hls = "https://test-streams.mux.dev/x36xh11/x36xh11.m3u8";
  const hls2 =
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8";

  const demo: ContentItem[] = [
    {
      id: randomUUID(),
      title: "Big Buck Bunny (demo stream)",
      description: "Public test HLS used when MX APIs are unreachable.",
      category: "movie",
      genre: "Family",
      year: 2008,
      featured: true,
      posterSrc:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
    },
    {
      id: randomUUID(),
      title: "BipBop Sample (demo stream)",
      description: "Apple sample multi‑bitrate HLS manifest.",
      category: "movie",
      genre: "Sci‑Fi",
      year: 2010,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls2,
      streamType: "hls",
    },
    {
      id: randomUUID(),
      title: "Neon Nights",
      description: "Synth‑noir thriller demo entry.",
      category: "movie",
      genre: "Thriller",
      year: 2023,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1598899134739-24d246f240b2?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
    },
    {
      id: randomUUID(),
      title: "Coastal Roads",
      description: "Road‑trip drama demo entry.",
      category: "movie",
      genre: "Drama",
      year: 2022,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
    },
    {
      id: randomUUID(),
      title: "Metro Squad",
      description: "Urban action demo entry.",
      category: "movie",
      genre: "Action",
      year: 2024,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
    },
    {
      id: randomUUID(),
      title: "Laugh Track",
      description: "Feel‑good comedy demo entry.",
      category: "movie",
      genre: "Comedy",
      year: 2021,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
    },
    {
      id: randomUUID(),
      title: "Midnight Signal",
      description: "Mystery mini‑series (demo episodes share the same test stream).",
      category: "tvshow",
      genre: "Mystery",
      year: 2023,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
      episodes: [
        {
          id: randomUUID(),
          title: "Pilot",
          description: "Episode 1 — demo playback.",
          episodeNumber: 1,
          seasonTitle: "Season 1",
          streamUrl: hls,
          streamType: "hls",
          posterSrc:
            "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80",
          year: 2023,
        },
        {
          id: randomUUID(),
          title: "Signal Lost",
          description: "Episode 2 — demo playback.",
          episodeNumber: 2,
          seasonTitle: "Season 1",
          streamUrl: hls,
          streamType: "hls",
          posterSrc:
            "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80",
          year: 2023,
        },
      ],
    },
    {
      id: randomUUID(),
      title: "Harbor City",
      description: "Crime drama series demo.",
      category: "tvshow",
      genre: "Crime",
      year: 2020,
      featured: false,
      posterSrc:
        "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80",
      streamUrl: hls,
      streamType: "hls",
      episodes: [
        {
          id: randomUUID(),
          title: "Harbor lights",
          description: "Episode 1 — demo playback.",
          episodeNumber: 1,
          seasonTitle: "Season 1",
          streamUrl: hls,
          streamType: "hls",
          posterSrc:
            "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80",
          year: 2020,
        },
      ],
    },
  ];

  return dedupeAndFixFeatured(demo);
}

function loadCatalogFromJsonFile(filePath: string): ContentItem[] {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Catalog JSON must be an array of content items.");
  }
  return parsed as ContentItem[];
}

async function seedCollection(coll: Collection<CatalogDocument>, docs: CatalogDocument[]) {
  await coll.deleteMany({});
  if (docs.length === 0) {
    console.warn("No catalog documents to insert.");
    return;
  }
  await coll.insertMany(docs);
  console.log(`Inserted ${docs.length} catalog document(s).`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Set MONGODB_URI (e.g. mongodb://127.0.0.1:27017) before seeding.");
    process.exit(1);
  }

  const db = await getDb();
  const coll = db.collection<CatalogDocument>(CATALOG_COLLECTION);

  const jsonPath = process.env.MX_CATALOG_JSON_PATH;
  if (jsonPath) {
    const abs = path.isAbsolute(jsonPath) ? jsonPath : path.join(process.cwd(), jsonPath);
    if (!existsSync(abs)) {
      console.error(`File not found: ${abs}`);
      process.exit(1);
    }
    const items = loadCatalogFromJsonFile(abs);
    const docs = items.map((item) => toDocument({ ...item, id: item.id || randomUUID() }));
    await seedCollection(coll, docs);
    return;
  }

  console.log("Fetching MX Player catalog (api origin from MX_HOME_TAB_URL)…");
  let items = await fetchItemsFromHomeTab();
  if (items.length === 0) {
    console.warn(
      "MX tab/detail returned no items (set MX_HOME_TAB_URL, check network, or MX_STREAM_BASE_URL for HLS paths). Using demo catalog.",
    );
    items = fallbackCatalog();
  } else {
    console.log(`Prepared ${items.length} item(s) from MX to insert.`);
  }

  const docs = items.map((item) => toDocument(item));
  await seedCollection(coll, docs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
