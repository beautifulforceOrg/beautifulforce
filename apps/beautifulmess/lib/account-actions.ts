"use server";

import { redirect } from "next/navigation";
import { db } from "@storeforge/db";
import { createSession, destroySession, getSessionCustomerId, hashPassword, verifyPassword } from "./auth";
import { toggleWishlistFor } from "./wishlist";

export interface AuthResult {
  error?: string;
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.customer.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = hashPassword(password);
  const customer = existing
    ? await db.customer.update({ where: { id: existing.id }, data: { passwordHash, name: name ?? existing.name } })
    : await db.customer.create({ data: { email, name, passwordHash } });

  await createSession(customer.id);
  redirect("/account");
}

export async function logIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const customer = await db.customer.findUnique({ where: { email } });
  if (!customer?.passwordHash || !verifyPassword(password, customer.passwordHash)) {
    return { error: "Incorrect email or password." };
  }

  await createSession(customer.id);
  redirect("/account");
}

export async function logOut(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function toggleWishlist(productId: string): Promise<{ wishlisted: boolean; requiresLogin?: boolean }> {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    return { wishlisted: false, requiresLogin: true };
  }

  return toggleWishlistFor(customerId, productId);
}
