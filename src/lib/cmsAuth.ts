import type { NextRequest } from "next/server";

export const CMS_SESSION_COOKIE = "cms_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const getSessionSecret = () => process.env.CMS_SESSION_SECRET || "dev-cms-session-secret-change-me";

const textEncoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const hmac = async (value: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return toHex(signature);
};

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

export const createCmsSessionToken = async (email: string) => {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${email}.${exp}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
};

export const isCmsSessionValid = async (token: string | undefined | null) => {
  if (!token) return false;
  const [email, expRaw, sig] = token.split(".");
  if (!email || !expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expectedSig = await hmac(`${email}.${exp}`);
  return timingSafeEqual(sig, expectedSig);
};

export const isCmsAuthenticated = async (request: NextRequest) =>
  isCmsSessionValid(request.cookies.get(CMS_SESSION_COOKIE)?.value);

export const getCmsCredentials = () => ({
  email: process.env.CMS_ADMIN_EMAIL || process.env.CMS_ADMIN_USERNAME || "admin@example.com",
  password: process.env.CMS_ADMIN_PASSWORD || "admin123",
});
