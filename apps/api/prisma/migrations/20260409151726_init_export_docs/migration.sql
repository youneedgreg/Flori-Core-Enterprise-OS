-- CreateEnum
CREATE TYPE "ExportDocType" AS ENUM ('PHYTOSANITARY', 'EXPORT_PERMIT', 'CUSTOMS_INVOICE', 'CERTIFICATE_OF_ORIGIN');

-- CreateTable
CREATE TABLE "export_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "ExportDocType" NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_documents_tenantId_idx" ON "export_documents"("tenantId");

-- CreateIndex
CREATE INDEX "export_documents_orderId_idx" ON "export_documents"("orderId");

-- AddForeignKey
ALTER TABLE "export_documents" ADD CONSTRAINT "export_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_documents" ADD CONSTRAINT "export_documents_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
