-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('GLOBAL_GAP', 'FAIRTRADE', 'KFC_SILVER', 'MPS', 'RAINFOREST_ALLIANCE', 'OTHER');

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "CertificationType" NOT NULL,
    "customName" TEXT,
    "issuedBy" TEXT,
    "certNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "certifications_tenantId_idx" ON "certifications"("tenantId");

-- CreateIndex
CREATE INDEX "certifications_expiryDate_idx" ON "certifications"("expiryDate");

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
