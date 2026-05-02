import { NextRequest, NextResponse } from "next/server";
import { isStreamType, searchCatalogItems } from "@/lib/catalogStore";
import { createStreamToken } from "@/lib/streamSecurity";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const genre = searchParams.get("genre");
  const type = searchParams.get("type");

  const data = await searchCatalogItems(
    q,
    genre,
    type && isStreamType(type) ? type : null,
  );

  const items = data.map((item) => {
    const token = createStreamToken("content", item.id);
    return {
      ...item,
      streamUrl: undefined,
      playbackUrl: `/api/stream/content/${item.id}?exp=${token.exp}&sig=${token.sig}`,
    };
  });

  return NextResponse.json({ query: q, items, total: items.length });
}
