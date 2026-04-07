/*
  Warnings:

  - You are about to drop the column `boxNumber` on the `packed_boxes` table. All the data in the column will be lost.
  - You are about to drop the column `bunchCount` on the `packed_boxes` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `packed_boxes` table. All the data in the column will be lost.
  - You are about to drop the `box_inventory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[boxId]` on the table `packed_boxes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `boxId` to the `packed_boxes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bunchesPerBox` to the `packed_boxes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalStems` to the `packed_boxes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WastageReason" AS ENUM ('TEMPERATURE_DAMAGE', 'DISEASE', 'PEST_DAMAGE', 'PHYSICAL_DAMAGE', 'EXPIRED', 'GRADING_REJECT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BoxStatus" ADD VALUE 'ALLOCATED';
ALTER TYPE "BoxStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "BoxStatus" ADD VALUE 'WASTED';

-- DropForeignKey
ALTER TABLE "box_inventory" DROP CONSTRAINT "box_inventory_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "box_inventory" DROP CONSTRAINT "box_inventory_varietyId_fkey";

-- DropForeignKey
ALTER TABLE "packed_boxes" DROP CONSTRAINT "packed_boxes_batchId_fkey";

-- DropIndex
DROP INDEX "packed_boxes_batchId_idx";

-- DropIndex
DROP INDEX "packed_boxes_boxNumber_key";

-- AlterTable
ALTER TABLE "packed_boxes" DROP COLUMN "boxNumber",
DROP COLUMN "bunchCount",
DROP COLUMN "quantity",
ADD COLUMN     "boxId" TEXT NOT NULL,
ADD COLUMN     "bunchesPerBox" INTEGER NOT NULL,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "totalStems" INTEGER NOT NULL,
ALTER COLUMN "batchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "varieties" ADD COLUMN     "defaultCostPerStem" DOUBLE PRECISION;

-- DropTable
DROP TABLE "box_inventory";

-- CreateTable
CREATE TABLE "wastage_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "grade" "QCGrade" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "WastageReason" NOT NULL,
    "costPerStem" DOUBLE PRECISION,
    "costImpact" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wastage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wastage_logs_tenantId_idx" ON "wastage_logs"("tenantId");

-- CreateIndex
CREATE INDEX "wastage_logs_createdAt_idx" ON "wastage_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "packed_boxes_boxId_key" ON "packed_boxes"("boxId");

-- CreateIndex
CREATE INDEX "packed_boxes_boxId_idx" ON "packed_boxes"("boxId");

-- AddForeignKey
ALTER TABLE "packed_boxes" ADD CONSTRAINT "packed_boxes_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "flower_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packed_boxes" ADD CONSTRAINT "packed_boxes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wastage_logs" ADD CONSTRAINT "wastage_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wastage_logs" ADD CONSTRAINT "wastage_logs_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
