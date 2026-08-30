import { NextResponse } from "next/server";
import { db } from "@storeforge/db";
import { hashPassword } from "../../../../../lib/auth";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "../../../../../lib/session-token";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() || null : null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await db.customer.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const customer = existing
    ? await db.customer.update({ where: { id: existing.id }, data: { passwordHash, name: name ?? existing.name } })
    : await db.customer.create({ data: { email, name, passwordHash } });

  const token = createSessionToken(customer.id);
  return NextResponse.json({ token, expiresInSeconds: SESSION_MAX_AGE_SECONDS });
}
