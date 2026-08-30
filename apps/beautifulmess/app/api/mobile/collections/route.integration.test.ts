import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const SLUG = "mobile-collections-test";

async function cleanup() {
  await db.collection.deleteMany({ where: { slug: SLUG } });
}

beforeEach(async () => {
  await cleanup();
  await db.collection.create({ data: { slug: SLUG, name: "Mobile Collections Test" } });
});

afterAll(cleanup);

describe("GET /api/mobile/collections", () => {
  it("lists all collections", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body).toContainEqual({ id: expect.any(String), slug: SLUG, name: "Mobile Collections Test" });
  });
});
