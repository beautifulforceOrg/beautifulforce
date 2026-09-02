import { db } from "@storeforge/db";
import type { AddressValue } from "@storeforge/ui";
import { hashPassword, verifyPassword } from "./auth";

export interface SettingsResult {
  error?: string;
}

/**
 * Pure, cookie-free core logic (no getSessionCustomerId()/cookies() here)
 * so it can be unit-tested directly -- see lib/account-actions.ts for the
 * Server Action wrappers that resolve customerId from the session cookie,
 * matching lib/admin/auth.ts's findAdminUserForCustomer split.
 */
export async function changeEmailFor(
  customerId: string,
  newEmail: string,
  currentPassword: string
): Promise<SettingsResult> {
  const email = newEmail.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer?.passwordHash || !verifyPassword(currentPassword, customer.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  if (email === customer.email) return {};

  const existing = await db.customer.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  await db.customer.update({ where: { id: customerId }, data: { email } });
  return {};
}

export async function changePasswordFor(
  customerId: string,
  currentPassword: string,
  newPassword: string
): Promise<SettingsResult> {
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer?.passwordHash || !verifyPassword(currentPassword, customer.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  await db.customer.update({ where: { id: customerId }, data: { passwordHash: hashPassword(newPassword) } });
  return {};
}

export async function getSavedAddressFor(customerId: string): Promise<AddressValue | null> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      addressName: true,
      email: true,
      addressPhone: true,
      addressLine1: true,
      addressLine2: true,
      addressCity: true,
      addressState: true,
      addressPincode: true,
    },
  });
  if (!customer?.addressLine1) return null;

  return {
    name: customer.addressName ?? "",
    email: customer.email,
    phone: customer.addressPhone ?? "",
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2 ?? "",
    city: customer.addressCity ?? "",
    state: customer.addressState ?? "",
    pincode: customer.addressPincode ?? "",
  };
}

/** Write-through save, called by lib/checkout.ts#placeOrderFor after a logged-in order. */
export async function saveAddressFor(customerId: string, address: AddressValue): Promise<void> {
  await db.customer.update({
    where: { id: customerId },
    data: {
      addressName: address.name,
      addressPhone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || null,
      addressCity: address.city,
      addressState: address.state,
      addressPincode: address.pincode,
    },
  });
}
