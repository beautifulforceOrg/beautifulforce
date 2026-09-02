"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { createFaqItem, createTestimonial, deleteFaqItem, deleteTestimonial } from "../../../../lib/admin/content";

export async function createTestimonialAction(name: string, quote: string): Promise<void> {
  await requireAdminOrThrow();
  await createTestimonial(name, quote);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function deleteTestimonialAction(id: string): Promise<void> {
  await requireAdminOrThrow();
  await deleteTestimonial(id);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function createFaqItemAction(question: string, answer: string): Promise<void> {
  await requireAdminOrThrow();
  await createFaqItem(question, answer);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function deleteFaqItemAction(id: string): Promise<void> {
  await requireAdminOrThrow();
  await deleteFaqItem(id);
  revalidatePath("/admin/content");
  revalidatePath("/");
}
