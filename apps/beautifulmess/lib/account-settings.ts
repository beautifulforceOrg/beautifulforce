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

export interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// Address never stores email -- AddressValue's `email` field is always
// the logged-in customer's own email, filled in by the caller (see
// app/checkout/page.tsx), not something saved per-address.
export type AddressInput = Omit<AddressValue, "email">;

function toSavedAddress(address: {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}): SavedAddress {
  return { ...address, addressLine2: address.addressLine2 ?? "" };
}

export async function listAddressesFor(customerId: string): Promise<SavedAddress[]> {
  const addresses = await db.address.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return addresses.map(toSavedAddress);
}

export async function getDefaultAddressFor(customerId: string): Promise<SavedAddress | null> {
  const address = await db.address.findFirst({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return address ? toSavedAddress(address) : null;
}

/** The first address a customer ever saves becomes their default automatically. */
export async function createAddressFor(
  customerId: string,
  label: string,
  address: AddressInput
): Promise<SavedAddress> {
  const existingCount = await db.address.count({ where: { customerId } });
  const created = await db.address.create({
    data: {
      customerId,
      label: label.trim() || "Address",
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: existingCount === 0,
    },
  });
  return toSavedAddress(created);
}

export async function updateAddressFor(
  customerId: string,
  addressId: string,
  label: string,
  address: AddressInput
): Promise<SettingsResult> {
  const existing = await db.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.customerId !== customerId) return { error: "Address not found." };

  await db.address.update({
    where: { id: addressId },
    data: {
      label: label.trim() || "Address",
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
  });
  return {};
}

/** If the deleted address was the default and others remain, the most recent one is promoted. */
export async function deleteAddressFor(customerId: string, addressId: string): Promise<SettingsResult> {
  const existing = await db.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.customerId !== customerId) return { error: "Address not found." };

  await db.address.delete({ where: { id: addressId } });

  if (existing.isDefault) {
    const nextDefault = await db.address.findFirst({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
    if (nextDefault) {
      await db.address.update({ where: { id: nextDefault.id }, data: { isDefault: true } });
    }
  }
  return {};
}

export async function setDefaultAddressFor(customerId: string, addressId: string): Promise<SettingsResult> {
  const existing = await db.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.customerId !== customerId) return { error: "Address not found." };

  await db.$transaction([
    db.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } }),
    db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
  return {};
}

/**
 * Called by lib/checkout.ts#placeOrderFor after a logged-in order --
 * only auto-saves when the customer has no addresses yet (their first
 * order's address becomes their default), so repeat orders to the same
 * place don't silently pile up duplicate address-book entries. Adding
 * more addresses afterward is a deliberate action in account settings.
 */
export async function saveFirstAddressFor(customerId: string, address: AddressInput): Promise<void> {
  const existingCount = await db.address.count({ where: { customerId } });
  if (existingCount > 0) return;
  await createAddressFor(customerId, "Home", address);
}
