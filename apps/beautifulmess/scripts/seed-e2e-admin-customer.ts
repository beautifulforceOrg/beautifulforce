// One-time e2e fixture: a Customer row whose email matches the seeded
// e2e AdminUser (see pretest:e2e's ADMIN_SEED_EMAIL). e2e/admin-auth.spec.ts's
// "Admin tab" tests need this account to already exist rather than have
// each of the 3 browser projects race to sign it up concurrently against
// the shared local Postgres -- exactly that race surfaced as a flaky
// Prisma error the first time this suite ran with all projects at once.
import { db } from "@storeforge/db";
import { hashPassword } from "../lib/auth";

const EMAIL = "admin-e2e-test@example.com";
const PASSWORD = "e2e admin-tab customer password";

async function main() {
  await db.customer.upsert({
    where: { email: EMAIL },
    update: { passwordHash: hashPassword(PASSWORD) },
    create: { email: EMAIL, passwordHash: hashPassword(PASSWORD) },
  });
  console.log(`Seeded e2e customer ${EMAIL} for the Admin-tab tests.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
