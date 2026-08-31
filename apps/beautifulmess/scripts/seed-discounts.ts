// Seeds the client's real discount codes from their Shopify export
// (data/shopify-export/discounts_export_1.csv) into the DiscountCode
// table -- previously this was a hardcoded single-entry map in
// lib/discount.ts; now that there's an admin UI to manage codes, the one
// real code needs to actually exist as a row instead of being dropped.
// Idempotent: upserts on the unique `code`, safe to re-run.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { db } from "@storeforge/db";

const DATA_DIR = join(import.meta.dirname, "..", "data", "shopify-export");

interface DiscountRow {
  Name: string;
  Value: string;
  "Value Type": string;
  Status: string;
}

async function main() {
  const csv = readFileSync(join(DATA_DIR, "discounts_export_1.csv"), "utf-8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as DiscountRow[];

  for (const row of rows) {
    if (row["Value Type"] !== "percentage") continue; // this app's DiscountCode model only models percent-off
    const percentOff = Math.round(Math.abs(Number(row.Value)));
    const code = row.Name.trim().toUpperCase();

    await db.discountCode.upsert({
      where: { code },
      update: { percentOff, active: row.Status === "Active" },
      create: { code, percentOff, active: row.Status === "Active" },
    });
    console.log(`Seeded discount code ${code} (${percentOff}% off, active=${row.Status === "Active"}).`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
