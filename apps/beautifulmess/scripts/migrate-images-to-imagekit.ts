// One-time migration: re-hosts every real product/site image this
// storefront currently hotlinks from beautifulmess.in's Shopify CDN onto
// our own ImageKit account, so the site no longer depends on the client's
// (different, unrelated) e-commerce platform staying online.
//
// Run once, locally, with real credentials as env vars (never commit
// them): see the README note this script prints on a missing var.
//
// Usage:
//   IMAGEKIT_PRIVATE_KEY=... IMAGEKIT_PUBLIC_KEY=... IMAGEKIT_URL_ENDPOINT=... \
//     DATABASE_URL=... pnpm exec tsx scripts/migrate-images-to-imagekit.ts
//
// Writes a mapping of old -> new URLs to
// scripts/.imagekit-migration-mapping.json (gitignored) so a follow-up
// step can update the hardcoded URLs in app/page.tsx and
// app/site-header.tsx without needing the credentials again.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import ImageKit from "imagekit";
import { db } from "@storeforge/db";

const REQUIRED_ENV = ["IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_PUBLIC_KEY", "IMAGEKIT_URL_ENDPOINT"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var ${key}. See this script's header comment for usage.`);
    process.exit(1);
  }
}

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

// The hardcoded, non-catalog image URLs this app also references
// directly in app/page.tsx and app/site-header.tsx -- kept here as a
// flat list so the same upload+mapping pass covers them too.
const STATIC_URLS = [
  "https://beautifulmess.in/cdn/shop/files/BM_Logo.png?height=90&v=1720072314",
  "https://beautifulmess.in/cdn/shop/files/services.svg?v=1760093091&width=1200",
  "https://beautifulmess.in/cdn/shop/files/services_1.svg?v=1760093091&width=1200",
  "https://beautifulmess.in/cdn/shop/files/services_2.svg?v=1760093091&width=1200",
  "https://beautifulmess.in/cdn/shop/files/WhatsApp_Image_2026-07-09_at_10.00.57.jpg?v=1783590607&width=1600",
  "https://beautifulmess.in/cdn/shop/files/WhatsApp_Image_2026-07-09_at_15.23.34.jpg?height=540&v=1783590954",
  "https://beautifulmess.in/cdn/shop/files/mother-daughter-sharing-hot-beverages.jpg?v=1760329482",
  "https://beautifulmess.in/cdn/shop/files/a-wooden-figurine-of-mother-and-child.jpg?v=1760329773",
  "https://beautifulmess.in/cdn/shop/files/girl-in-dress-on-bed.jpg?v=1760329801",
  "https://beautifulmess.in/cdn/shop/files/girl-blowing-bubbles-at-park.jpg?v=1760329827",
  "https://beautifulmess.in/cdn/shop/files/gq_35c9e59f-d64a-4f2a-b636-78149a2c87de.avif?v=1760096282&width=1200",
  "https://beautifulmess.in/cdn/shop/files/Adobe_Express_-_file.png?v=1761837237&width=1200",
  "https://beautifulmess.in/cdn/shop/files/elle_0265bd0c-2d96-4739-a3cb-9674b7a9e2cb.avif?v=1760096283&width=1200",
  "https://beautifulmess.in/cdn/shop/files/RollingStone_logo-2.avif?v=1760096283&width=1200",
];

function fileNameFor(url: string): string {
  const path = new URL(url).pathname;
  return path.split("/").pop() || `image-${Date.now()}`;
}

async function uploadOne(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const result = await imagekit.upload({
    file: buffer,
    fileName: fileNameFor(url),
    folder: "/beautifulmess",
    useUniqueFileName: false,
  });
  return result.url;
}

async function main() {
  const dbHost = new URL(process.env.DATABASE_URL ?? "").host || "(unknown)";
  console.log(`Connecting to database host: ${dbHost}`);

  const images = await db.productImage.findMany({ select: { id: true, url: true } });
  const alreadyMigrated = images.filter((image) => image.url.includes("ik.imagekit.io")).length;
  if (images.length > 0 && alreadyMigrated === images.length) {
    console.error(
      `All ${images.length} ProductImage rows on ${dbHost} already point at ik.imagekit.io -- ` +
        `this database was already migrated. Did you mean to point DATABASE_URL at a different database?`
    );
    process.exit(1);
  }
  const uniqueCatalogUrls = Array.from(new Set(images.map((image) => image.url)));
  const allUrls = Array.from(new Set([...uniqueCatalogUrls, ...STATIC_URLS]));

  console.log(`Uploading ${allUrls.length} unique images to ImageKit...`);
  const mapping: Record<string, string> = {};
  for (const [index, url] of allUrls.entries()) {
    try {
      mapping[url] = await uploadOne(url);
      console.log(`[${index + 1}/${allUrls.length}] ${url} -> ${mapping[url]}`);
    } catch (error) {
      console.error(`[${index + 1}/${allUrls.length}] FAILED ${url}:`, error);
    }
  }

  console.log("Updating ProductImage rows...");
  let updated = 0;
  for (const image of images) {
    const newUrl = mapping[image.url];
    if (!newUrl || newUrl === image.url) continue;
    await db.productImage.update({ where: { id: image.id }, data: { url: newUrl } });
    updated += 1;
  }
  console.log(`Updated ${updated} ProductImage rows.`);

  const mappingPath = join(import.meta.dirname, ".imagekit-migration-mapping.json");
  writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`Wrote mapping to ${mappingPath}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
