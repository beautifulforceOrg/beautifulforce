// One-time import of the old (pre-Storeforge) website's customer export
// into this app's Customer table -- see docs/pending-actions.md/CLAUDE.md
// history for context. The source CSV is a Shopify customer export and is
// NOT checked into this repo (it's real customer PII) -- pass its path
// explicitly.
//
// Usage:
//   pnpm exec tsx scripts/import-legacy-customers.ts <path-to-csv>            (dry run, default)
//   pnpm exec tsx scripts/import-legacy-customers.ts <path-to-csv> --apply    (writes to the database)
//
// Safe to re-run: an already-imported contact (matched by email or phone
// against an existing Customer row) is skipped, not duplicated.
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { db } from "@storeforge/db";
import { analyzeRows, type LegacyCustomerRow } from "./legacy-customers";

async function main() {
  const [csvPath, mode] = process.argv.slice(2);
  if (!csvPath) {
    console.error("Usage: tsx scripts/import-legacy-customers.ts <path-to-csv> [--apply]");
    process.exit(1);
  }
  const apply = mode === "--apply";

  const raw = readFileSync(csvPath, "utf-8");
  const rows: LegacyCustomerRow[] = parse(raw, { columns: true, skip_empty_lines: true });
  const { totalRows, excludedTestOrOwnDomain, excludedNoContactInfo, duplicatePhoneRowsCollapsed, finalContacts: candidates } =
    analyzeRows(rows);

  console.log(`Source rows: ${totalRows}`);
  console.log(`Excluded (test account / store's own domain): ${excludedTestOrOwnDomain}`);
  console.log(`Excluded (no email and no phone): ${excludedNoContactInfo}`);
  console.log(`Duplicate-phone rows collapsed into one: ${duplicatePhoneRowsCollapsed}`);
  console.log(`Remaining candidates: ${candidates.length}`);

  let toCreate = 0;
  let skippedExistingEmail = 0;
  let skippedExistingPhone = 0;

  for (const contact of candidates) {
    const existing = await db.customer.findFirst({
      where: {
        OR: [contact.email ? { email: contact.email } : undefined, contact.phone ? { phone: contact.phone } : undefined].filter(
          (clause): clause is NonNullable<typeof clause> => clause !== undefined
        ),
      },
    });

    if (existing) {
      if (contact.email && existing.email === contact.email) skippedExistingEmail++;
      else skippedExistingPhone++;
      continue;
    }

    toCreate++;
    if (apply) {
      await db.customer.create({
        data: { email: contact.email, phone: contact.phone, name: contact.name },
      });
    }
  }

  console.log(`Already existing (matched by email): ${skippedExistingEmail}`);
  console.log(`Already existing (matched by phone): ${skippedExistingPhone}`);
  console.log(`${apply ? "Created" : "Would create"}: ${toCreate}`);
  if (!apply) console.log("\nDry run only -- re-run with --apply to actually write these to the database.");

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
