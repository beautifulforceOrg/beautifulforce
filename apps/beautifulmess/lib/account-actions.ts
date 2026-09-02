"use server";

import { redirect } from "next/navigation";
import { db } from "@storeforge/db";
import {
  changeEmailFor,
  changePasswordFor,
  createAddressFor,
  deleteAddressFor,
  listAddressesFor,
  setDefaultAddressFor,
  updateAddressFor,
  type AddressInput,
  type SavedAddress,
  type SettingsResult,
} from "./account-settings";
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

export async function changeEmail(formData: FormData): Promise<SettingsResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { error: "You must be logged in." };

  const newEmail = String(formData.get("email") ?? "");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  return changeEmailFor(customerId, newEmail, currentPassword);
}

export async function changePassword(formData: FormData): Promise<SettingsResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { error: "You must be logged in." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  return changePasswordFor(customerId, currentPassword, newPassword);
}

/**
 * Used by app/checkout/page.tsx: the saved address book (to prefill the
 * default and offer a picker) plus the customer's own email, which
 * Address rows never store (AddressValue's `email` field is always the
 * logged-in customer's, not per-address).
 */
export async function getCheckoutAddressData(): Promise<{ email: string; addresses: SavedAddress[] } | null> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return null;

  const customer = await db.customer.findUnique({ where: { id: customerId }, select: { email: true } });
  if (!customer) return null;

  return { email: customer.email, addresses: await listAddressesFor(customerId) };
}

export async function listAddresses(): Promise<SavedAddress[]> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return [];
  return listAddressesFor(customerId);
}

export async function createAddress(label: string, address: AddressInput): Promise<SettingsResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { error: "You must be logged in." };
  await createAddressFor(customerId, label, address);
  return {};
}

export async function updateAddress(addressId: string, label: string, address: AddressInput): Promise<SettingsResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { error: "You must be logged in." };
  return updateAddressFor(customerId, addressId, label, address);
}

export async function deleteAddress(addressId: string): Promise<SettingsResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { error: "You must be logged in." };
  return deleteAddressFor(customerId, addressId);
}

export async function setDefaultAddress(addressId: string): Promise<SettingsResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return { error: "You must be logged in." };
  return setDefaultAddressFor(customerId, addressId);
}

export async function toggleWishlist(productId: string): Promise<{ wishlisted: boolean; requiresLogin?: boolean }> {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    return { wishlisted: false, requiresLogin: true };
  }

  return toggleWishlistFor(customerId, productId);
}
