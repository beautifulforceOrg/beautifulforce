"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@storeforge/db";
import { requireAdminOrThrow } from "../../../../../lib/admin/auth";
import { setOrderStatus } from "../../../../../lib/admin/orders";

export async function setOrderStatusAction(orderId: string, status: OrderStatus): Promise<void> {
  await requireAdminOrThrow();
  await setOrderStatus(orderId, status);
  revalidatePath(`/admin/orders/${orderId}`);
}
