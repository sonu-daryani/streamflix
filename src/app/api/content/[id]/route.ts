import { NextRequest, NextResponse } from "next/server";
import {
  deleteCatalogItem,
  findCatalogItemById,
  isStreamType,
  updateCatalogItem,
} from "@/lib/catalogStore";
import { createStreamToken } from "@/lib/streamSecurity";
import { isCmsAuthenticated } from "@/lib/cmsAuth";
import type { ContentItem } from "@/lib/types";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await findCatalogItemById(id);
  if (!item) {
    return NextResponse.json({ message: "Content not found." }, { status: 404 });
  }
  const token = createStreamToken("content", item.id);
  return NextResponse.json({
    ...item,
    streamUrl: undefined,
    playbackUrl: `/api/stream/content/${item.id}?exp=${token.exp}&sig=${token.sig}`,
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await isCmsAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  if (typeof body.streamType === "string" && !isStreamType(body.streamType)) {
    return NextResponse.json({ message: "Invalid stream type." }, { status: 400 });
  }

  const exists = await findCatalogItemById(id);
  if (!exists) {
    return NextResponse.json({ message: "Content not found." }, { status: 404 });
  }

  const patch: Parameters<typeof updateCatalogItem>[1] = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.category === "string") patch.category = body.category;
  if (typeof body.genre === "string") patch.genre = body.genre;
  if (typeof body.year === "number") patch.year = body.year;
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (typeof body.posterSrc === "string") patch.posterSrc = body.posterSrc;
  if (typeof body.streamUrl === "string") patch.streamUrl = body.streamUrl;
  if (typeof body.streamType === "string" && isStreamType(body.streamType)) {
    patch.streamType = body.streamType;
  }
  if (Array.isArray(body.episodes)) {
    patch.episodes = body.episodes as NonNullable<ContentItem["episodes"]>;
  }

  const updated = await updateCatalogItem(id, patch);
  if (!updated) {
    return NextResponse.json({ message: "Content not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await isCmsAuthenticated(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await deleteCatalogItem(id);
  if (!removed) {
    return NextResponse.json({ message: "Content not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
