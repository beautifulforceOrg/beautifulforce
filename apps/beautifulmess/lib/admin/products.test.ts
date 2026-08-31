import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  addProductImage,
  addVariant,
  createProduct,
  deleteProduct,
  deleteProductImage,
  deleteVariant,
  reorderImages,
  updateProduct,
  updateVariant,
} from "./products";

const SLUG = "admin-products-test-item";
const SLUG_2 = "admin-products-test-item-2";

async function cleanup() {
  await db.product.deleteMany({ where: { slug: { in: [SLUG, SLUG_2] } } });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("createProduct / updateProduct / deleteProduct", () => {
  it("creates a product with the full set of inventory fields", async () => {
    const result = await createProduct({
      slug: SLUG,
      name: "Test Item",
      price: 1999,
      sku: "TEST-SKU-1",
      weightGrams: 150,
      packageWeightGrams: 200,
      packageLengthCm: 12,
      packageWidthCm: 10,
      packageHeightCm: 3,
      mrp: 2499,
    });

    expect(result.ok).toBe(true);
    const product = await db.product.findUniqueOrThrow({ where: { slug: SLUG } });
    expect(product.sku).toBe("TEST-SKU-1");
    expect(product.packageWeightGrams).toBe(200);
    expect(product.isPublished).toBe(true); // default
  });

  it("rejects a duplicate slug with a friendly error, not a raw Prisma error", async () => {
    await createProduct({ slug: SLUG, name: "First", price: 1000 });
    const result = await createProduct({ slug: SLUG, name: "Second", price: 1000 });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });

  it("rejects a duplicate SKU across different products", async () => {
    await createProduct({ slug: SLUG, name: "First", price: 1000, sku: "DUP-SKU" });
    const result = await createProduct({ slug: SLUG_2, name: "Second", price: 1000, sku: "DUP-SKU" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });

  it("updates a product's fields", async () => {
    const created = await createProduct({ slug: SLUG, name: "Original", price: 1000 });
    await updateProduct(created.data!.id, { slug: SLUG, name: "Updated", price: 1500, isPublished: false });

    const product = await db.product.findUniqueOrThrow({ where: { slug: SLUG } });
    expect(product.name).toBe("Updated");
    expect(product.price).toBe(1500);
    expect(product.isPublished).toBe(false);
  });

  it("tolerates being passed a full Prisma-shaped object with relation arrays (e.g. from the edit form's initial value)", async () => {
    const created = await createProduct({ slug: SLUG, name: "Original", price: 1000 });
    const fullShape = {
      slug: SLUG,
      name: "Updated via full shape",
      price: 1200,
      images: [],
      variants: [{ id: "fake", name: "Size", value: "M" }],
      collections: [{ id: "fake-collection" }],
    };

    const result = await updateProduct(created.data!.id, fullShape as never);
    expect(result.ok).toBe(true);
    expect((await db.product.findUniqueOrThrow({ where: { slug: SLUG } })).name).toBe("Updated via full shape");
  });

  it("deletes a product with no orders", async () => {
    const created = await createProduct({ slug: SLUG, name: "To delete", price: 1000 });
    const result = await deleteProduct(created.data!.id);

    expect(result.ok).toBe(true);
    expect(await db.product.findUnique({ where: { slug: SLUG } })).toBeNull();
  });
});

describe("variants", () => {
  it("adds a variant and surfaces the @@unique([productId,name,value]) violation as a friendly error", async () => {
    const created = await createProduct({ slug: SLUG, name: "Variant test", price: 1000 });
    const productId = created.data!.id;

    const first = await addVariant(productId, { name: "Size", value: "M" });
    expect(first.ok).toBe(true);

    const duplicate = await addVariant(productId, { name: "Size", value: "M" });
    expect(duplicate.ok).toBe(false);
    expect(duplicate.error).toMatch(/already has a variant/);
  });

  it("rejects a duplicate SKU on a different variant", async () => {
    const created = await createProduct({ slug: SLUG, name: "Variant sku test", price: 1000 });
    const productId = created.data!.id;
    await addVariant(productId, { name: "Size", value: "S", sku: "VAR-SKU-1" });

    const result = await addVariant(productId, { name: "Size", value: "M", sku: "VAR-SKU-1" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/SKU is already in use/);
  });

  it("updates and deletes a variant", async () => {
    const created = await createProduct({ slug: SLUG, name: "Variant edit test", price: 1000 });
    const variant = await addVariant(created.data!.id, { name: "Size", value: "S" });

    await updateVariant(variant.data!.id, { name: "Size", value: "S", stockQty: 5 });
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.data!.id } })).stockQty).toBe(5);

    await deleteVariant(variant.data!.id);
    expect(await db.productVariant.findUnique({ where: { id: variant.data!.id } })).toBeNull();
  });
});

describe("images", () => {
  it("assigns increasing positions and reorders them", async () => {
    const created = await createProduct({ slug: SLUG, name: "Image test", price: 1000 });
    const productId = created.data!.id;

    const first = await addProductImage(productId, { url: "https://example.com/1.jpg" });
    const second = await addProductImage(productId, { url: "https://example.com/2.jpg" });

    const images = await db.productImage.findMany({ where: { productId }, orderBy: { position: "asc" } });
    expect(images.map((image) => image.id)).toEqual([first.id, second.id]);

    await reorderImages([second.id, first.id]);
    const reordered = await db.productImage.findMany({ where: { productId }, orderBy: { position: "asc" } });
    expect(reordered.map((image) => image.id)).toEqual([second.id, first.id]);
  });

  it("deletes an image", async () => {
    const created = await createProduct({ slug: SLUG, name: "Image delete test", price: 1000 });
    const image = await addProductImage(created.data!.id, { url: "https://example.com/1.jpg" });

    await deleteProductImage(image.id);
    expect(await db.productImage.findUnique({ where: { id: image.id } })).toBeNull();
  });
});
