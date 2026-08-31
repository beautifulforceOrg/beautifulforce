// Seeds/updates one AdminUser row. There is no "create admin" UI in the
// dashboard -- the set of admins is fixed and small, so this one-off CLI
// script is the only way an admin account's password gets set.
//
// Usage:
//   ADMIN_SEED_EMAIL="owner@example.com" ADMIN_SEED_PASSWORD="..." \
//     pnpm exec dotenv -e .env.test.local -e .env.test -- tsx scripts/seed-admin-users.ts
//
// The password is never hardcoded here -- always supplied via env var at
// invocation time, and never committed anywhere. Run once per admin
// email; re-running for the same email updates that admin's password.
import { db } from "@storeforge/db";
import { hashPassword } from "../lib/auth";
import { isAllowedAdminEmail } from "../lib/admin/auth";

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must both be set");
  }
  if (!isAllowedAdminEmail(email)) {
    throw new Error(`${email} is not in ADMIN_ALLOWED_EMAILS -- refusing to seed a non-allowlisted admin`);
  }

  const admin = await db.adminUser.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), failedAttempts: 0, lockedUntil: null },
    create: { email, passwordHash: hashPassword(password) },
  });

  console.log(`Seeded admin user ${admin.email} (${admin.id}).`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
