import { NextRequest, NextResponse } from "next/server";
import { findCatalogItemById } from "@/lib/catalogStore";
import { validateStreamToken } from "@/lib/streamSecurity";
import { getTvChannels } from "@/lib/tvPlaylist";

type Params = {
  params: Promise<{ kind: string; id: string }>;
};

const isStreamKind = (k: string): k is "content" | "tv" => k === "content" || k === "tv";

const isBlockedHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") {
    return true;
  }
  if (normalized.startsWith("10.") || normalized.startsWith("192.168.")) return true;
  if (normalized.startsWith("172.")) {
    const secondOctet = Number(normalized.split(".")[1] || "0");
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  return false;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { kind: kindParam, id } = await params;
  if (!isStreamKind(kindParam)) {
    return NextResponse.json({ message: "Invalid stream kind." }, { status: 400 });
  }
  const kind = kindParam;
  const exp = request.nextUrl.searchParams.get("exp");
  const sig = request.nextUrl.searchParams.get("sig");
  if (!exp || !sig || !validateStreamToken(kind, id, exp, sig)) {
    return NextResponse.json({ message: "Unauthorized stream access." }, { status: 401 });
  }

  if (kind === "content") {
    const content = await findCatalogItemById(id);
    if (!content) {
      return NextResponse.json({ message: "Stream not found." }, { status: 404 });
    }
    const streamUrl = content.streamUrl;
    if (!streamUrl) {
      return NextResponse.json({ message: "Stream URL missing." }, { status: 404 });
    }
    return NextResponse.redirect(streamUrl, { status: 302 });
  }

  const channels = await getTvChannels();
  const channel = channels.find((entry) => entry.id === id);
  if (!channel) {
    return NextResponse.json({ message: "TV stream not found." }, { status: 404 });
  }

  const overrideUrl = request.nextUrl.searchParams.get("u");
  const sourceUrl = overrideUrl || channel.streamUrl;

  let parsedSource: URL;
  try {
    parsedSource = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ message: "Invalid source URL." }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsedSource.protocol) || isBlockedHost(parsedSource.hostname)) {
    return NextResponse.json({ message: "Blocked stream source." }, { status: 400 });
  }

  let upstream: Response;
  try {
    const forwardHeaders: Record<string, string> = {
      "user-agent":
        request.headers.get("user-agent") ||
        "Mozilla/5.0 (compatible; StreamFlix/1.0)",
    };
    const range = request.headers.get("range");
    if (range) {
      forwardHeaders.range = range;
    }

    upstream = await fetch(sourceUrl, {
      headers: forwardHeaders,
    });
  } catch (error) {
    const fetchError = error as NodeJS.ErrnoException;
    return NextResponse.json(
      {
        message: "Upstream stream unavailable.",
        reason: fetchError.code || "FETCH_FAILED",
        host: parsedSource.hostname,
      },
      { status: 502 },
    );
  }
  if (!upstream.ok) {
    return NextResponse.json(
      {
        message: "Upstream stream unavailable.",
        status: upstream.status,
        host: parsedSource.hostname,
      },
      { status: 502 },
    );
  }
  const resolvedSourceUrl = upstream.url || sourceUrl;

  const contentType = upstream.headers.get("content-type") || "";
  const isLikelyPlaylist =
    contentType.includes("mpegurl") ||
    resolvedSourceUrl.includes(".m3u8") ||
    resolvedSourceUrl.includes(".m3u");

  if (isLikelyPlaylist) {
    const maybeText = await upstream.text();
    const isPlaylist = maybeText.trimStart().startsWith("#EXTM3U");
    if (!isPlaylist) {
      return new Response(maybeText, {
        status: upstream.status,
        headers: {
          "content-type": contentType || "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    const rewritten = maybeText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith("#")) {
          // Rewrite encrypted key/media-map URI attributes when present.
          if (line.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (_, raw) => {
              const absolute = new URL(raw, resolvedSourceUrl).toString();
              const proxied = new URL(`/api/stream/tv/${id}`, request.nextUrl.origin);
              proxied.searchParams.set("exp", exp);
              proxied.searchParams.set("sig", sig);
              proxied.searchParams.set("u", absolute);
              return `URI="${proxied.toString()}"`;
            });
          }
          return line;
        }
        const absolute = new URL(trimmed, resolvedSourceUrl).toString();
        const proxied = new URL(
          `/api/stream/tv/${id}`,
          request.nextUrl.origin,
        );
        proxied.searchParams.set("exp", exp);
        proxied.searchParams.set("sig", sig);
        proxied.searchParams.set("u", absolute);
        return proxied.toString();
      })
      .join("\n");

    return new Response(rewritten, {
      status: 200,
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "no-store",
      },
    });
  }

  const passthroughHeaders = new Headers();
  passthroughHeaders.set("content-type", contentType || "application/octet-stream");
  passthroughHeaders.set("cache-control", "no-store");
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (contentLength) passthroughHeaders.set("content-length", contentLength);
  if (contentRange) passthroughHeaders.set("content-range", contentRange);
  if (acceptRanges) passthroughHeaders.set("accept-ranges", acceptRanges);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: passthroughHeaders,
  });
}
