import { NextRequest, NextResponse } from "next/server";
import { findCatalogItemById, getRelatedCatalogItems } from "@/lib/catalogStore";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await findCatalogItemById(id);
  if (!item) {
    return NextResponse.json({ message: "Content not found." }, { status: 404 });
  }

  const relatedRaw = await getRelatedCatalogItems(id, item.genre, 8);
  const related = relatedRaw.map((row) => {
    const { streamUrl: _streamUrl, ...rest } = row;
    return rest;
  });

  return NextResponse.json({ itemId: id, related });
}
