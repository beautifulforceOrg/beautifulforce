"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { markContactHandled } from "../../../../lib/admin/contact";

export async function markContactHandledAction(id: string): Promise<void> {
  await requireAdminOrThrow();
  await markContactHandled(id);
  revalidatePath("/admin/contact");
}
