import { NextRequest, NextResponse } from "next/server";
import {
  createCatalogItem,
  isStreamType,
  listCatalogForApi,
} from "@/lib/catalogStore";
import type { ContentItem } from "@/lib/types";
import { createStreamToken } from "@/lib/streamSecurity";
import { isCmsAuthenticated } from "@/lib/cmsAuth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const genre = searchParams.get("genre");
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const featured = searchParams.get("featured");
  const limit = Number(searchParams.get("limit") ?? "0");
  const page = Number(searchParams.get("page") ?? "0");
  const isPaginated = page > 0 && limit > 0;

  const { items: data, total, page: outPage, limit: outLimit, hasMore } =
    await listCatalogForApi({
      genre,
      category,
      type,
      featured,
      limit,
      page,
      isPaginated,
    });

  const items = data.map((item) => {
    const token = createStreamToken("content", item.id);
    return {
      ...item,
      streamUrl: undefined,
      playbackUrl: `/api/stream/content/${item.id}?exp=${token.exp}&sig=${token.sig}`,
    };
  });

  return NextResponse.json({
    items,
    total,
    page: outPage,
    limit: outLimit,
    hasMore,
  });
}

export async function POST(request: NextRequest) {
  if (!(await isCmsAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ContentItem>;
  if (
    !body.title ||
    !body.description ||
    !body.genre ||
    !body.posterSrc ||
    !body.streamUrl ||
    !body.streamType ||
    !isStreamType(body.streamType)
  ) {
    return NextResponse.json(
      { message: "Invalid content payload." },
      { status: 400 },
    );
  }

  const episodes =
    Array.isArray(body.episodes) && body.episodes.length > 0 ? body.episodes : undefined;

  const created = await createCatalogItem({
    title: body.title,
    description: body.description,
    category: body.category || "movie",
    genre: body.genre,
    year: Number(body.year) || new Date().getFullYear(),
    featured: Boolean(body.featured),
    posterSrc: body.posterSrc,
    streamUrl: body.streamUrl as string,
    streamType: body.streamType,
    episodes,
  });

  return NextResponse.json(created, { status: 201 });
}
