-- CreateEnum
CREATE TYPE "StoreItemCategory" AS ENUM ('FERTILISER', 'PESTICIDE', 'SEED', 'PACKAGING', 'PPE', 'SPARE_PART', 'OTHER');

-- CreateEnum
CREATE TYPE "StoreMovementType" AS ENUM ('GRN', 'ISSUE', 'RETURN', 'WRITE_OFF');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ZoneType" ADD VALUE 'WAREHOUSE';
ALTER TYPE "ZoneType" ADD VALUE 'STORE';

-- AlterTable
ALTER TABLE "farm_profiles" ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'KES';

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "StoreItemCategory" NOT NULL DEFAULT 'OTHER',
    "unit" TEXT NOT NULL DEFAULT 'units',
    "description" TEXT,
    "minStockLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderPoint" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_stock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "type" "StoreMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "toZoneId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_items_tenantId_idx" ON "store_items"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "store_items_tenantId_sku_key" ON "store_items"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "store_stock_tenantId_idx" ON "store_stock"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "store_stock_tenantId_itemId_zoneId_key" ON "store_stock"("tenantId", "itemId", "zoneId");

-- CreateIndex
CREATE INDEX "store_movements_tenantId_idx" ON "store_movements"("tenantId");

-- CreateIndex
CREATE INDEX "store_movements_itemId_idx" ON "store_movements"("itemId");

-- CreateIndex
CREATE INDEX "store_movements_createdAt_idx" ON "store_movements"("createdAt");

-- AddForeignKey
ALTER TABLE "store_items" ADD CONSTRAINT "store_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_stock" ADD CONSTRAINT "store_stock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_stock" ADD CONSTRAINT "store_stock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_stock" ADD CONSTRAINT "store_stock_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_movements" ADD CONSTRAINT "store_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_movements" ADD CONSTRAINT "store_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_movements" ADD CONSTRAINT "store_movements_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
