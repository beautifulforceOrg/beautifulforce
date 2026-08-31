import { db, Prisma } from "@storeforge/db";
import type { AdminActionResult } from "./products";

export interface DiscountInput {
  code: string;
  percentOff: number;
  active: boolean;
}

export async function listDiscounts() {
  return db.discountCode.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createDiscount(input: DiscountInput): Promise<AdminActionResult<{ id: string }>> {
  try {
    const discount = await db.discountCode.create({
      data: { code: input.code.trim().toUpperCase(), percentOff: input.percentOff, active: input.active },
    });
    return { ok: true, data: { id: discount.id } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A discount code with that name already exists." };
    }
    throw error;
  }
}

export async function updateDiscount(id: string, input: DiscountInput): Promise<AdminActionResult> {
  try {
    await db.discountCode.update({
      where: { id },
      data: { code: input.code.trim().toUpperCase(), percentOff: input.percentOff, active: input.active },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "A discount code with that name already exists." };
    }
    throw error;
  }
}

export async function deactivateDiscount(id: string): Promise<void> {
  await db.discountCode.update({ where: { id }, data: { active: false } });
}
