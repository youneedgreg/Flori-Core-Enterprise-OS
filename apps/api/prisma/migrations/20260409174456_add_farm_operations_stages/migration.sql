-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "baseCredit" DOUBLE PRECISION,
ADD COLUMN     "baseDebit" DOUBLE PRECISION,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'USD';

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soil_tests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "zoneId" TEXT,
    "testDate" TIMESTAMP(3) NOT NULL,
    "pHLevel" DOUBLE PRECISION,
    "ecLevel" DOUBLE PRECISION,
    "nitrogen" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "soilType" TEXT,
    "structure" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soil_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_prep_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "details" TEXT,
    "amendmentsUsed" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_prep_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_budgets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "laborWorkersReq" INTEGER,
    "estimatedLaborCost" DOUBLE PRECISION,
    "estimatedInputCost" DOUBLE PRECISION,
    "estimatedUtilitiesCost" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planting_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "supplier" TEXT,
    "lotNumber" TEXT,
    "spacing" TEXT,
    "density" DOUBLE PRECISION,
    "totalPlants" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irrigation_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "volumeLiters" DOUBLE PRECISION,
    "method" TEXT NOT NULL,
    "fertigationUsed" BOOLEAN NOT NULL DEFAULT false,
    "fertilizerType" TEXT,
    "npkLevels" TEXT,
    "applicationRate" DOUBLE PRECISION,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "irrigation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scouting_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "pestDiseaseName" TEXT,
    "severity" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "actionTaken" TEXT,
    "inspectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scouting_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_performance_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "growthRate" TEXT,
    "healthScore" INTEGER,
    "budFormation" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_performance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_harvest_quality_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "budStage" TEXT,
    "budSizeMm" DOUBLE PRECISION,
    "stemLengthCm" DOUBLE PRECISION,
    "stemStrength" TEXT,
    "colorDev" TEXT,
    "inspectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_harvest_quality_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantityStems" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "rejectedStems" INTEGER,
    "notes" TEXT,
    "supervisorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_tenantId_code_key" ON "accounts"("tenantId", "code");

-- CreateIndex
CREATE INDEX "exchange_rates_tenantId_fromCurrency_toCurrency_idx" ON "exchange_rates"("tenantId", "fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "soil_tests_tenantId_idx" ON "soil_tests"("tenantId");

-- CreateIndex
CREATE INDEX "land_prep_logs_tenantId_idx" ON "land_prep_logs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "crop_budgets_cropCycleId_key" ON "crop_budgets"("cropCycleId");

-- CreateIndex
CREATE INDEX "crop_budgets_tenantId_idx" ON "crop_budgets"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "planting_records_cropCycleId_key" ON "planting_records"("cropCycleId");

-- CreateIndex
CREATE INDEX "planting_records_tenantId_idx" ON "planting_records"("tenantId");

-- CreateIndex
CREATE INDEX "irrigation_logs_tenantId_idx" ON "irrigation_logs"("tenantId");

-- CreateIndex
CREATE INDEX "scouting_reports_tenantId_idx" ON "scouting_reports"("tenantId");

-- CreateIndex
CREATE INDEX "crop_performance_logs_tenantId_idx" ON "crop_performance_logs"("tenantId");

-- CreateIndex
CREATE INDEX "pre_harvest_quality_logs_tenantId_idx" ON "pre_harvest_quality_logs"("tenantId");

-- CreateIndex
CREATE INDEX "harvest_records_tenantId_idx" ON "harvest_records"("tenantId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_tests" ADD CONSTRAINT "soil_tests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_tests" ADD CONSTRAINT "soil_tests_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_prep_logs" ADD CONSTRAINT "land_prep_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_prep_logs" ADD CONSTRAINT "land_prep_logs_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_prep_logs" ADD CONSTRAINT "land_prep_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_budgets" ADD CONSTRAINT "crop_budgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_budgets" ADD CONSTRAINT "crop_budgets_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_records" ADD CONSTRAINT "planting_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_records" ADD CONSTRAINT "planting_records_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_logs" ADD CONSTRAINT "irrigation_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_logs" ADD CONSTRAINT "irrigation_logs_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_logs" ADD CONSTRAINT "irrigation_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_performance_logs" ADD CONSTRAINT "crop_performance_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_performance_logs" ADD CONSTRAINT "crop_performance_logs_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_performance_logs" ADD CONSTRAINT "crop_performance_logs_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_harvest_quality_logs" ADD CONSTRAINT "pre_harvest_quality_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_harvest_quality_logs" ADD CONSTRAINT "pre_harvest_quality_logs_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_harvest_quality_logs" ADD CONSTRAINT "pre_harvest_quality_logs_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
