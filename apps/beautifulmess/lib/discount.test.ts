import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { applyDiscountCode } from "./discount";

const ACTIVE_CODE = "TEST10";
const INACTIVE_CODE = "TESTOLD";

async function cleanup() {
  await db.discountCode.deleteMany({ where: { code: { in: [ACTIVE_CODE, INACTIVE_CODE] } } });
}

beforeEach(async () => {
  await cleanup();
  await db.discountCode.create({ data: { code: ACTIVE_CODE, percentOff: 10, active: true } });
  await db.discountCode.create({ data: { code: INACTIVE_CODE, percentOff: 20, active: false } });
});

afterAll(cleanup);

describe("applyDiscountCode", () => {
  it("applies an active code as a fraction off", async () => {
    expect(await applyDiscountCode(ACTIVE_CODE, 10000)).toEqual({
      valid: true,
      code: ACTIVE_CODE,
      percentOff: 0.1,
      amountOff: 1000,
    });
  });

  it("is case-insensitive and trims whitespace", async () => {
    expect((await applyDiscountCode(`  ${ACTIVE_CODE.toLowerCase()} `, 10000)).valid).toBe(true);
  });

  it("rejects a deactivated code", async () => {
    expect((await applyDiscountCode(INACTIVE_CODE, 10000)).valid).toBe(false);
  });

  it("rejects an unknown code", async () => {
    expect(await applyDiscountCode("NOTREAL", 10000)).toEqual({
      valid: false,
      code: "NOTREAL",
      percentOff: 0,
      amountOff: 0,
    });
  });
});
