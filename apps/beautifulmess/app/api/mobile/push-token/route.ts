import { NextResponse } from "next/server";
import { db } from "@storeforge/db";
import { getCustomerIdFromAuthHeader } from "../../../../lib/auth";

export async function POST(request: Request) {
  const customerId = getCustomerIdFromAuthHeader(request);
  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  await db.customer.update({ where: { id: customerId }, data: { expoPushToken: token } });
  return NextResponse.json({ ok: true });
}
