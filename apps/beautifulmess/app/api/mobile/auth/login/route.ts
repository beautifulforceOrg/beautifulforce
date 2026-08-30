import { NextResponse } from "next/server";
import { db } from "@storeforge/db";
import { verifyPassword } from "../../../../../lib/auth";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "../../../../../lib/session-token";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const customer = await db.customer.findUnique({ where: { email } });
  if (!customer?.passwordHash || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Delivered in the JSON body, not a Set-Cookie header -- mobile has no
  // cookie jar. The token is the exact same format createSessionToken()
  // produces for the web cookie path (see lib/session-token.ts).
  const token = createSessionToken(customer.id);
  return NextResponse.json({ token, expiresInSeconds: SESSION_MAX_AGE_SECONDS });
}
