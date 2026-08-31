"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { createDiscount, deactivateDiscount, updateDiscount, type DiscountInput } from "../../../../lib/admin/discounts";
import type { AdminActionResult } from "../../../../lib/admin/products";

export async function createDiscountAction(input: DiscountInput): Promise<AdminActionResult<{ id: string }>> {
  await requireAdminOrThrow();
  const result = await createDiscount(input);
  if (result.ok) revalidatePath("/admin/discounts");
  return result;
}

export async function updateDiscountAction(id: string, input: DiscountInput): Promise<AdminActionResult> {
  await requireAdminOrThrow();
  const result = await updateDiscount(id, input);
  if (result.ok) revalidatePath("/admin/discounts");
  return result;
}

export async function deactivateDiscountAction(id: string): Promise<void> {
  await requireAdminOrThrow();
  await deactivateDiscount(id);
  revalidatePath("/admin/discounts");
}
