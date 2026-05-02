import crypto from "crypto";

const STREAM_SECRET = process.env.STREAM_SIGNING_SECRET || "dev-stream-secret";

const sign = (payload: string) =>
  crypto.createHmac("sha256", STREAM_SECRET).update(payload).digest("hex");

export const createStreamToken = (kind: "content" | "tv", id: string, ttlMs = 600000) => {
  const exp = Date.now() + ttlMs;
  const payload = `${kind}:${id}:${exp}`;
  const sig = sign(payload);
  return { exp, sig };
};

export const validateStreamToken = (
  kind: "content" | "tv",
  id: string,
  exp: string,
  sig: string,
) => {
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const payload = `${kind}:${id}:${expiresAt}`;
  const expected = sign(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
};
