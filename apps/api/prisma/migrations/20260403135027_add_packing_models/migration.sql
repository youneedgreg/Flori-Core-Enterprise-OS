-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('PACKED', 'IN_COLD_STORAGE', 'SHIPPED');

-- CreateTable
CREATE TABLE "packed_boxes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "boxNumber" TEXT NOT NULL,
    "status" "BoxStatus" NOT NULL DEFAULT 'PACKED',
    "grade" "QCGrade" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "bunchSize" INTEGER NOT NULL,
    "bunchCount" INTEGER NOT NULL,
    "packDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination" TEXT,
    "labelUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packed_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_inventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "grade" "QCGrade" NOT NULL,
    "bunchSize" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "box_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packed_boxes_boxNumber_key" ON "packed_boxes"("boxNumber");

-- CreateIndex
CREATE INDEX "packed_boxes_tenantId_idx" ON "packed_boxes"("tenantId");

-- CreateIndex
CREATE INDEX "packed_boxes_batchId_idx" ON "packed_boxes"("batchId");

-- CreateIndex
CREATE INDEX "box_inventory_tenantId_idx" ON "box_inventory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "box_inventory_tenantId_varietyId_grade_bunchSize_key" ON "box_inventory"("tenantId", "varietyId", "grade", "bunchSize");

-- AddForeignKey
ALTER TABLE "packed_boxes" ADD CONSTRAINT "packed_boxes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packed_boxes" ADD CONSTRAINT "packed_boxes_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "flower_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packed_boxes" ADD CONSTRAINT "packed_boxes_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_inventory" ADD CONSTRAINT "box_inventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_inventory" ADD CONSTRAINT "box_inventory_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
