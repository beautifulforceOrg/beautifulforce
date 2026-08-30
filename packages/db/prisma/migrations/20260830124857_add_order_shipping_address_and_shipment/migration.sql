-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "awbCode" TEXT,
ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "shipToAddressLine1" TEXT,
ADD COLUMN     "shipToAddressLine2" TEXT,
ADD COLUMN     "shipToCity" TEXT,
ADD COLUMN     "shipToEmail" TEXT,
ADD COLUMN     "shipToName" TEXT,
ADD COLUMN     "shipToPhone" TEXT,
ADD COLUMN     "shipToPincode" TEXT,
ADD COLUMN     "shipToState" TEXT,
ADD COLUMN     "shipmentId" TEXT;
