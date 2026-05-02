import { NextRequest, NextResponse } from "next/server";
import {
  CMS_SESSION_COOKIE,
  createCmsSessionToken,
  getCmsCredentials,
} from "@/lib/cmsAuth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; password?: string; username?: string };
  const email = (body.email || body.username || "").trim().toLowerCase();
  const password = body.password || "";
  const credentials = getCmsCredentials();

  if (email !== credentials.email.toLowerCase() || password !== credentials.password) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(CMS_SESSION_COOKIE, await createCmsSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
