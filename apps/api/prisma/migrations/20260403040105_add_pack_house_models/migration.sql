-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('INTAKE', 'QC_PENDING', 'QC_COMPLETED', 'REJECTED', 'INVENTORY_ADDED');

-- CreateEnum
CREATE TYPE "QCGrade" AS ENUM ('A', 'B', 'C', 'REJECT');

-- CreateTable
CREATE TABLE "flower_batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantityIntake" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'INTAKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flower_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "stemLength" DOUBLE PRECISION NOT NULL,
    "bloomStage" TEXT NOT NULL,
    "headDiameter" DOUBLE PRECISION NOT NULL,
    "defects" JSONB NOT NULL,
    "assignedGrade" "QCGrade" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flower_inventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "grade" "QCGrade" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flower_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flower_batches_batchNumber_key" ON "flower_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "flower_batches_tenantId_idx" ON "flower_batches"("tenantId");

-- CreateIndex
CREATE INDEX "flower_batches_batchNumber_idx" ON "flower_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "qc_logs_tenantId_idx" ON "qc_logs"("tenantId");

-- CreateIndex
CREATE INDEX "qc_logs_batchId_idx" ON "qc_logs"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "flower_inventory_tenantId_varietyId_grade_key" ON "flower_inventory"("tenantId", "varietyId", "grade");

-- AddForeignKey
ALTER TABLE "flower_batches" ADD CONSTRAINT "flower_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_batches" ADD CONSTRAINT "flower_batches_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_batches" ADD CONSTRAINT "flower_batches_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_logs" ADD CONSTRAINT "qc_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_logs" ADD CONSTRAINT "qc_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "flower_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_inventory" ADD CONSTRAINT "flower_inventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_inventory" ADD CONSTRAINT "flower_inventory_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
