// Seed-script convention every storefront's copy of this schema follows:
// idempotent upserts keyed on a natural unique field (slug, email), safe to
// re-run against an existing database.
import { createPrismaClient } from "../src/client";

const db = createPrismaClient();

async function main() {
  await db.product.upsert({
    where: { slug: "sample-item" },
    update: {},
    create: { slug: "sample-item", name: "Sample Item", price: 5500 },
  });
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
