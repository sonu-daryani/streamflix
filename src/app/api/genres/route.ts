import { NextResponse } from "next/server";
import { getDistinctGenres } from "@/lib/catalogStore";

export async function GET() {
  const genres = await getDistinctGenres();
  return NextResponse.json({ genres });
}
