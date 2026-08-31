"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { createProduct, deleteProduct, type ProductInput, type AdminActionResult } from "../../../../lib/admin/products";

export async function createProductAction(input: ProductInput): Promise<AdminActionResult<{ id: string }>> {
  await requireAdminOrThrow();
  const result = await createProduct(input);
  if (result.ok) {
    revalidatePath("/admin/products");
    redirect(`/admin/products/${result.data!.id}`);
  }
  return result;
}

export async function deleteProductAction(id: string): Promise<AdminActionResult> {
  await requireAdminOrThrow();
  const result = await deleteProduct(id);
  if (result.ok) revalidatePath("/admin/products");
  return result;
}
