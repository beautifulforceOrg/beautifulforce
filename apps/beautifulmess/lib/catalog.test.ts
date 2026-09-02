import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { searchProducts } from "./catalog";

const NAME_MATCH_SLUG = "catalog-search-test-name-match";
const DESCRIPTION_MATCH_SLUG = "catalog-search-test-description-match";
const TAGS_MATCH_SLUG = "catalog-search-test-tags-match";
const SKU_MATCH_SLUG = "catalog-search-test-sku-match";
const UNPUBLISHED_SLUG = "catalog-search-test-unpublished";
const STEM_SLUG = "catalog-search-test-stemming";
const ALL_SLUGS = [
  NAME_MATCH_SLUG,
  DESCRIPTION_MATCH_SLUG,
  TAGS_MATCH_SLUG,
  SKU_MATCH_SLUG,
  UNPUBLISHED_SLUG,
  STEM_SLUG,
];

async function cleanup() {
  await db.product.deleteMany({ where: { slug: { in: ALL_SLUGS } } });
}

beforeEach(async () => {
  await cleanup();
  await db.product.createMany({
    data: [
      { slug: NAME_MATCH_SLUG, name: "Zephyr Unicorn Frock", price: 100000 },
      {
        slug: DESCRIPTION_MATCH_SLUG,
        name: "Plain Blue Dress",
        description: "<p>Hand-embroidered with a <b>galaxy</b> motif.</p>",
        price: 100000,
      },
      { slug: TAGS_MATCH_SLUG, name: "Simple Skirt", tags: "party, festive-wear", price: 100000 },
      { slug: SKU_MATCH_SLUG, name: "Everyday Top", sku: "BM-GALAXY-042", price: 100000 },
      { slug: UNPUBLISHED_SLUG, name: "Unicorn Draft Product", isPublished: false, price: 100000 },
      { slug: STEM_SLUG, name: "Sparkly Frocks Collection Piece", price: 100000 },
    ],
  });
});

afterAll(cleanup);

describe("searchProducts", () => {
  it("finds a product by a substring of its name", async () => {
    const results = await searchProducts("Unicorn");
    expect(results.map((p) => p.slug)).toContain(NAME_MATCH_SLUG);
  });

  it("finds a product by a word in its (HTML) description", async () => {
    const results = await searchProducts("galaxy");
    expect(results.map((p) => p.slug)).toContain(DESCRIPTION_MATCH_SLUG);
  });

  it("finds a product by a tag", async () => {
    const results = await searchProducts("festive");
    expect(results.map((p) => p.slug)).toContain(TAGS_MATCH_SLUG);
  });

  it("finds a product by its SKU", async () => {
    const results = await searchProducts("BM-GALAXY-042");
    expect(results.map((p) => p.slug)).toContain(SKU_MATCH_SLUG);
  });

  it("finds a product by a partial SKU", async () => {
    const results = await searchProducts("GALAXY-042");
    expect(results.map((p) => p.slug)).toContain(SKU_MATCH_SLUG);
  });

  it("matches a plural/stemmed form of a word (fuzzy-ish matching)", async () => {
    const results = await searchProducts("frock");
    expect(results.map((p) => p.slug)).toContain(STEM_SLUG);
  });

  it("excludes unpublished products even if the name matches", async () => {
    const results = await searchProducts("Unicorn");
    expect(results.map((p) => p.slug)).not.toContain(UNPUBLISHED_SLUG);
  });

  it("does not confuse a description match with an unrelated SKU search", async () => {
    const results = await searchProducts("galaxy");
    // Both the description match and the SKU match contain "galaxy" --
    // both are legitimately relevant results.
    expect(results.map((p) => p.slug)).toEqual(
      expect.arrayContaining([DESCRIPTION_MATCH_SLUG, SKU_MATCH_SLUG])
    );
  });

  it("returns an empty list for no query", async () => {
    expect(await searchProducts("")).toEqual([]);
    expect(await searchProducts("   ")).toEqual([]);
  });

  it("returns an empty list when nothing matches", async () => {
    expect(await searchProducts("zzz-no-such-product-anywhere")).toEqual([]);
  });

  it("includes images and variants on each result, matching the original shape", async () => {
    const results = await searchProducts("Unicorn");
    const found = results.find((p) => p.slug === NAME_MATCH_SLUG);
    expect(found).toHaveProperty("images");
    expect(found).toHaveProperty("variants");
  });
});
