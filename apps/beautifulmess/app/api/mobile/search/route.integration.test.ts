import { db } from "@storeforge/db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const SLUG = "mobile-search-test-product";

async function cleanup() {
  await db.product.deleteMany({ where: { slug: SLUG } });
}

beforeEach(async () => {
  await cleanup();
  await db.product.create({ data: { slug: SLUG, name: "Mobile Search Test Unicorn Frock", price: 100000 } });
});

afterAll(cleanup);

describe("GET /api/mobile/search", () => {
  it("finds a product by a substring of its name", async () => {
    const response = await GET(new NextRequest("http://localhost/api/mobile/search?q=Unicorn"));
    const body = await response.json();
    expect(body.map((p: { slug: string }) => p.slug)).toContain(SLUG);
  });

  it("returns an empty list for no query", async () => {
    const response = await GET(new NextRequest("http://localhost/api/mobile/search"));
    expect(await response.json()).toEqual([]);
  });

  it("returns an empty list when nothing matches", async () => {
    const response = await GET(new NextRequest("http://localhost/api/mobile/search?q=zzz-no-such-product"));
    expect(await response.json()).toEqual([]);
  });
});
