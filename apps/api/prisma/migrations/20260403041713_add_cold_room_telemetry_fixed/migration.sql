/*
  Warnings:

  - The values [INTAKE,QC_COMPLETED,INVENTORY_ADDED] on the enum `BatchStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('GREENHOUSE', 'COLD_ROOM', 'PACKING_AREA', 'OFFICE');

-- CreateEnum
CREATE TYPE "ColdRoomEventType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- AlterEnum
BEGIN;
CREATE TYPE "BatchStatus_new" AS ENUM ('QC_PENDING', 'GRADED', 'REJECTED', 'IN_COLD_STORAGE', 'SHIPPED');
ALTER TABLE "public"."flower_batches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "flower_batches" ALTER COLUMN "status" TYPE "BatchStatus_new" USING ("status"::text::"BatchStatus_new");
ALTER TYPE "BatchStatus" RENAME TO "BatchStatus_old";
ALTER TYPE "BatchStatus_new" RENAME TO "BatchStatus";
DROP TYPE "public"."BatchStatus_old";
ALTER TABLE "flower_batches" ALTER COLUMN "status" SET DEFAULT 'QC_PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "flower_batches" ALTER COLUMN "status" SET DEFAULT 'QC_PENDING';

-- AlterTable
ALTER TABLE "zones" ADD COLUMN     "maxHumidity" DOUBLE PRECISION DEFAULT 100,
ADD COLUMN     "maxTemp" DOUBLE PRECISION DEFAULT 40,
ADD COLUMN     "minHumidity" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "minTemp" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "type" "ZoneType" NOT NULL DEFAULT 'GREENHOUSE';

-- CreateTable
CREATE TABLE "cold_room_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "type" "ColdRoomEventType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cold_room_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cold_room_events_tenantId_idx" ON "cold_room_events"("tenantId");

-- CreateIndex
CREATE INDEX "cold_room_events_batchId_idx" ON "cold_room_events"("batchId");

-- CreateIndex
CREATE INDEX "cold_room_events_zoneId_idx" ON "cold_room_events"("zoneId");

-- CreateIndex
CREATE INDEX "flower_inventory_tenantId_idx" ON "flower_inventory"("tenantId");

-- AddForeignKey
ALTER TABLE "cold_room_events" ADD CONSTRAINT "cold_room_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cold_room_events" ADD CONSTRAINT "cold_room_events_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cold_room_events" ADD CONSTRAINT "cold_room_events_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "flower_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cold_room_events" ADD CONSTRAINT "cold_room_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
