"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "../../../../../lib/admin/auth";
import {
  addProductImage,
  addVariant,
  deleteProductImage,
  deleteVariant,
  reorderImages,
  setProductCollections,
  updateProduct,
  updateVariant,
  type ProductInput,
  type VariantInput,
  type AdminActionResult,
} from "../../../../../lib/admin/products";

export async function updateProductAction(id: string, input: ProductInput): Promise<AdminActionResult> {
  await requireAdminOrThrow();
  const result = await updateProduct(id, input);
  if (result.ok) revalidatePath(`/admin/products/${id}`);
  return result;
}

export async function addVariantAction(
  productId: string,
  input: VariantInput
): Promise<AdminActionResult<{ id: string }>> {
  await requireAdminOrThrow();
  const result = await addVariant(productId, input);
  if (result.ok) revalidatePath(`/admin/products/${productId}`);
  return result;
}

export async function updateVariantAction(
  productId: string,
  variantId: string,
  input: VariantInput
): Promise<AdminActionResult> {
  await requireAdminOrThrow();
  const result = await updateVariant(variantId, input);
  if (result.ok) revalidatePath(`/admin/products/${productId}`);
  return result;
}

export async function deleteVariantAction(productId: string, variantId: string): Promise<void> {
  await requireAdminOrThrow();
  await deleteVariant(variantId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function addProductImageAction(productId: string, url: string): Promise<AdminActionResult> {
  await requireAdminOrThrow();
  await addProductImage(productId, { url });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function reorderImagesAction(productId: string, orderedImageIds: string[]): Promise<void> {
  await requireAdminOrThrow();
  await reorderImages(orderedImageIds);
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteProductImageAction(productId: string, imageId: string): Promise<void> {
  await requireAdminOrThrow();
  await deleteProductImage(imageId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function setProductCollectionsAction(productId: string, collectionIds: string[]): Promise<void> {
  await requireAdminOrThrow();
  await setProductCollections(productId, collectionIds);
  revalidatePath(`/admin/products/${productId}`);
}
