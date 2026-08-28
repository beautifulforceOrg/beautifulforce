import { createHmac, timingSafeEqual } from "node:crypto";

// The pure, cookie-free half of session handling -- kept separate from
// lib/auth.ts's next/headers cookies() calls so it can be unit tested
// directly (see session-token.test.ts) without a Next.js request context.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be set");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export function createSessionToken(customerId: string, now = Date.now()): string {
  const expires = now + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${customerId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string, now = Date.now()): string | null {
  const [customerId, expiresStr, signature] = token.split(".");
  if (!customerId || !expiresStr || !signature) return null;

  const payload = `${customerId}.${expiresStr}`;
  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  if (now > Number(expiresStr)) return null;

  return customerId;
}
