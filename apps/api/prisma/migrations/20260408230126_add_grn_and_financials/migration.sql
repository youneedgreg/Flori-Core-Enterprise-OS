-- CreateEnum
CREATE TYPE "GrnStatus" AS ENUM ('PENDING', 'RECONCILED', 'DISCREPANCY');

-- CreateTable
CREATE TABLE "goods_received_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "status" "GrnStatus" NOT NULL DEFAULT 'PENDING',
    "vendorId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT NOT NULL,
    "notes" TEXT,
    "discrepancyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_received_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_items" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityReceived" DOUBLE PRECISION NOT NULL,
    "unitPriceReceived" DOUBLE PRECISION NOT NULL,
    "totalPriceReceived" DOUBLE PRECISION NOT NULL,
    "poItemId" TEXT,
    "notes" TEXT,

    CONSTRAINT "grn_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_journals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goods_received_notes_grnNumber_key" ON "goods_received_notes"("grnNumber");

-- CreateIndex
CREATE INDEX "goods_received_notes_tenantId_idx" ON "goods_received_notes"("tenantId");

-- CreateIndex
CREATE INDEX "goods_received_notes_poId_idx" ON "goods_received_notes"("poId");

-- CreateIndex
CREATE INDEX "grn_items_grnId_idx" ON "grn_items"("grnId");

-- CreateIndex
CREATE INDEX "financial_journals_tenantId_idx" ON "financial_journals"("tenantId");

-- CreateIndex
CREATE INDEX "journal_entries_journalId_idx" ON "journal_entries"("journalId");

-- AddForeignKey
ALTER TABLE "goods_received_notes" ADD CONSTRAINT "goods_received_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_received_notes" ADD CONSTRAINT "goods_received_notes_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_received_notes" ADD CONSTRAINT "goods_received_notes_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_received_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_journals" ADD CONSTRAINT "financial_journals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "financial_journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
