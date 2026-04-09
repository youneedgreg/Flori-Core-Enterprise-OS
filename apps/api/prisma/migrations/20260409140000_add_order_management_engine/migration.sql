-- Data migration: map old enum values to new ones BEFORE altering enum types
-- OrderStatus: PENDING/PACKING → CONFIRMED, SHIPPED → DISPATCHED, CANCELLED → DRAFT
UPDATE "orders" SET "status" = 'DELIVERED'  WHERE "status" = 'DELIVERED';
UPDATE "orders" SET "status" = 'PENDING'    WHERE "status" = 'PENDING'   AND false; -- no-op placeholder
UPDATE "orders" SET "status" = 'SHIPPED'    WHERE "status" = 'SHIPPED'   AND false; -- no-op placeholder

-- Use a temp text column to safely migrate status
ALTER TABLE "orders" ADD COLUMN "status_new" TEXT;
UPDATE "orders" SET "status_new" = CASE
  WHEN "status"::text = 'PENDING'   THEN 'CONFIRMED'
  WHEN "status"::text = 'PACKING'   THEN 'CONFIRMED'
  WHEN "status"::text = 'SHIPPED'   THEN 'DISPATCHED'
  WHEN "status"::text = 'DELIVERED' THEN 'DELIVERED'
  WHEN "status"::text = 'CANCELLED' THEN 'DRAFT'
  ELSE 'DRAFT'
END;

-- Use a temp text column to safely migrate type
ALTER TABLE "orders" ADD COLUMN "type_new" TEXT;
UPDATE "orders" SET "type_new" = CASE
  WHEN "type"::text = 'EXPORT' THEN 'EXPORT_CONTRACT'
  WHEN "type"::text = 'LOCAL'  THEN 'SPOT_ORDER'
  ELSE 'SPOT_ORDER'
END;

-- CreateEnum
CREATE TYPE "TemplateFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterEnum OrderStatus
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('DRAFT', 'CONFIRMED', 'IN_PICKING', 'DISPATCHED', 'DELIVERED', 'INVOICED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status_new"::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum OrderType
BEGIN;
CREATE TYPE "OrderType_new" AS ENUM ('STANDING_ORDER', 'SPOT_ORDER', 'EXPORT_CONTRACT');
ALTER TABLE "orders" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "type" TYPE "OrderType_new" USING ("type_new"::"OrderType_new");
ALTER TYPE "OrderType" RENAME TO "OrderType_old";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
DROP TYPE "OrderType_old";
ALTER TABLE "orders" ALTER COLUMN "type" SET DEFAULT 'SPOT_ORDER';
COMMIT;

-- Drop temp columns
ALTER TABLE "orders" DROP COLUMN "status_new";
ALTER TABLE "orders" DROP COLUMN "type_new";

-- AlterTable: add new columns
ALTER TABLE "orders"
  ADD COLUMN "deliveryDate"        TIMESTAMP(3),
  ADD COLUMN "isTemplate"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "nextGenerationDate"  TIMESTAMP(3),
  ADD COLUMN "notes"               TEXT,
  ADD COLUMN "orderNumber"         TEXT,
  ADD COLUMN "parentTemplateId"    TEXT,
  ADD COLUMN "templateFrequency"   "TemplateFrequency";

-- CreateIndex
CREATE INDEX "orders_isTemplate_idx" ON "orders"("isTemplate");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_parentTemplateId_fkey"
  FOREIGN KEY ("parentTemplateId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
