import { NextResponse } from "next/server";
import type { TvChannel } from "@/lib/types";
import { createStreamToken } from "@/lib/streamSecurity";
import { getTvChannels } from "@/lib/tvPlaylist";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 40;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offsetParam = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limitParam = Number.parseInt(searchParams.get("limit") ?? `${DEFAULT_LIMIT}`, 10);
  const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const channels = await getTvChannels();
  const selectedChannels = channels.slice(offset, offset + limit);

  const items: TvChannel[] = selectedChannels.map((channel) => {
    const token = createStreamToken("tv", channel.id);
    return {
      id: channel.id,
      sourceId: channel.sourceId,
      title: channel.title,
      posterSrc:
        channel.logo ||
        "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=500&q=80",
      group: channel.group,
      streamType: channel.streamType,
      playbackUrl: `/api/stream/tv/${channel.id}?exp=${token.exp}&sig=${token.sig}`,
      drm: channel.drm,
    };
  });

  const nextOffset = offset + items.length;
  const hasMore = nextOffset < channels.length;

  return NextResponse.json({
    channels: items,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
    total: channels.length,
  });
}
