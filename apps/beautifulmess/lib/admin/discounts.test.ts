import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createDiscount, deactivateDiscount, listDiscounts, updateDiscount } from "./discounts";

const CODE = "ADMINTEST10";
const CODE_2 = "ADMINTEST20";

async function cleanup() {
  await db.discountCode.deleteMany({ where: { code: { in: [CODE, CODE_2] } } });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("createDiscount / updateDiscount / deactivateDiscount", () => {
  it("creates a discount, normalizing the code to uppercase", async () => {
    const result = await createDiscount({ code: CODE.toLowerCase(), percentOff: 10, active: true });
    expect(result.ok).toBe(true);

    const discount = await db.discountCode.findUniqueOrThrow({ where: { code: CODE } });
    expect(discount.percentOff).toBe(10);
    expect(discount.active).toBe(true);
  });

  it("rejects a duplicate code", async () => {
    await createDiscount({ code: CODE, percentOff: 10, active: true });
    const result = await createDiscount({ code: CODE, percentOff: 20, active: true });
    expect(result.ok).toBe(false);
  });

  it("updates a discount's percent-off", async () => {
    const created = await createDiscount({ code: CODE, percentOff: 10, active: true });
    await updateDiscount(created.data!.id, { code: CODE, percentOff: 15, active: true });

    expect((await db.discountCode.findUniqueOrThrow({ where: { code: CODE } })).percentOff).toBe(15);
  });

  it("deactivates a discount without deleting it", async () => {
    const created = await createDiscount({ code: CODE, percentOff: 10, active: true });
    await deactivateDiscount(created.data!.id);

    const discount = await db.discountCode.findUniqueOrThrow({ where: { code: CODE } });
    expect(discount.active).toBe(false);
  });

  it("lists all discounts", async () => {
    await createDiscount({ code: CODE, percentOff: 10, active: true });
    await createDiscount({ code: CODE_2, percentOff: 20, active: true });

    const discounts = await listDiscounts();
    expect(discounts.map((d) => d.code)).toEqual(expect.arrayContaining([CODE, CODE_2]));
  });
});
