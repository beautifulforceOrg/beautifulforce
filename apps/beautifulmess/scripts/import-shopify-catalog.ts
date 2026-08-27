// Imports this client's real Shopify product export into the local
// database -- see data/shopify-export/ for the source files and
// ../../beautifulmess-onboarding-plan.md Section 1 for why a CSV export
// was used instead of scraping the live site. Idempotent: safe to re-run,
// each product's variants/images are replaced (not appended) on every run.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { db } from "@storeforge/db";

const DATA_DIR = join(import.meta.dirname, "..", "data", "shopify-export");

interface ShopifyRow {
  Handle: string;
  Title: string;
  "Body (HTML)": string;
  "Product Category": string;
  "Option1 Name": string;
  "Option1 Value": string;
  "Variant Price": string;
  "Image Src": string;
  "Image Position": string;
}

interface ParsedProduct {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  collectionSlug: string | null;
  collectionName: string | null;
  variants: { name: string; value: string }[];
  images: string[];
}

function collectionFor(category: string): { slug: string; name: string } | null {
  if (category.includes("Handbags")) return { slug: "bags", name: "Bags" };
  if (category.includes("Clothing")) return { slug: "frocks", name: "Frocks" };
  if (category.includes("Gift Cards")) return { slug: "gift-cards", name: "Gift Cards" };
  return null;
}

function parseProducts(): ParsedProduct[] {
  const csvText = readFileSync(join(DATA_DIR, "products_export_1.csv"), "utf-8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true }) as ShopifyRow[];

  const byHandle = new Map<string, ShopifyRow[]>();
  for (const row of rows) {
    const existing = byHandle.get(row.Handle) ?? [];
    existing.push(row);
    byHandle.set(row.Handle, existing);
  }

  const products: ParsedProduct[] = [];
  for (const [handle, rowsForHandle] of byHandle) {
    const name = rowsForHandle.find((r) => r.Title)?.Title ?? handle;
    const description = rowsForHandle.find((r) => r["Body (HTML)"])?.["Body (HTML)"] || null;
    const priceStr = rowsForHandle.find((r) => r["Variant Price"])?.["Variant Price"] ?? "0";
    const price = Math.round(Number.parseFloat(priceStr) * 100);
    const category = rowsForHandle.find((r) => r["Product Category"])?.["Product Category"] ?? "";
    const collection = collectionFor(category);

    // Shopify's export only fills in "Option1 Name" on a product's first
    // row -- every subsequent variant row leaves it blank but still
    // carries its own "Option1 Value". Resolve the option name once per
    // product rather than per row, or every variant after the first is
    // silently dropped.
    const optionName = rowsForHandle.find((r) => r["Option1 Name"] && r["Option1 Name"] !== "Title")?.[
      "Option1 Name"
    ];

    const variants: { name: string; value: string }[] = [];
    const seenVariants = new Set<string>();
    for (const row of rowsForHandle) {
      const optionValue = row["Option1 Value"];
      if (!optionName || !optionValue || optionValue === "Default Title") continue;
      const key = `${optionName}:${optionValue}`;
      if (seenVariants.has(key)) continue;
      seenVariants.add(key);
      variants.push({ name: optionName, value: optionValue });
    }

    const images = rowsForHandle
      .filter((r) => r["Image Src"])
      .sort((a, b) => Number(a["Image Position"] || 0) - Number(b["Image Position"] || 0))
      .map((r) => r["Image Src"]);
    const uniqueImages = Array.from(new Set(images));

    products.push({
      slug: handle,
      name,
      description,
      price,
      collectionSlug: collection?.slug ?? null,
      collectionName: collection?.name ?? null,
      variants,
      images: uniqueImages,
    });
  }

  return products;
}

async function main() {
  const products = parseProducts();
  const collectionIds = new Map<string, string>();

  for (const product of products) {
    if (!product.collectionSlug || !product.collectionName) continue;
    if (collectionIds.has(product.collectionSlug)) continue;
    const collection = await db.collection.upsert({
      where: { slug: product.collectionSlug },
      update: { name: product.collectionName },
      create: { slug: product.collectionSlug, name: product.collectionName },
    });
    collectionIds.set(product.collectionSlug, collection.id);
  }

  for (const product of products) {
    const collectionId = product.collectionSlug ? collectionIds.get(product.collectionSlug) : undefined;

    const saved = await db.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        collections: collectionId ? { set: [{ id: collectionId }] } : { set: [] },
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
        collections: collectionId ? { connect: [{ id: collectionId }] } : undefined,
      },
    });

    await db.productVariant.deleteMany({ where: { productId: saved.id } });
    if (product.variants.length > 0) {
      await db.productVariant.createMany({
        data: product.variants.map((variant) => ({
          productId: saved.id,
          name: variant.name,
          value: variant.value,
        })),
      });
    }

    await db.productImage.deleteMany({ where: { productId: saved.id } });
    if (product.images.length > 0) {
      await db.productImage.createMany({
        data: product.images.map((url, position) => ({ productId: saved.id, url, position })),
      });
    }
  }

  console.log(`Imported ${products.length} products across ${collectionIds.size} collections.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
