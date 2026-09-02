-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: replaces the single-saved-address design (one row per
-- Customer) with the new Address book -- any customer who already had a
-- saved address gets it carried forward as their one, default address
-- rather than silently losing it.
INSERT INTO "Address" ("id", "customerId", "label", "name", "phone", "addressLine1", "addressLine2", "city", "state", "pincode", "isDefault", "createdAt")
SELECT
  gen_random_uuid()::text,
  "id",
  'Home',
  COALESCE("addressName", ''),
  COALESCE("addressPhone", ''),
  "addressLine1",
  "addressLine2",
  COALESCE("addressCity", ''),
  COALESCE("addressState", ''),
  COALESCE("addressPincode", ''),
  true,
  CURRENT_TIMESTAMP
FROM "Customer"
WHERE "addressLine1" IS NOT NULL;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "addressCity",
DROP COLUMN "addressLine1",
DROP COLUMN "addressLine2",
DROP COLUMN "addressName",
DROP COLUMN "addressPhone",
DROP COLUMN "addressPincode",
DROP COLUMN "addressState";
