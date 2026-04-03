-- CreateTable
CREATE TABLE "spray_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "chemicalName" TEXT NOT NULL,
    "epaRegNo" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "phiDays" INTEGER NOT NULL DEFAULT 0,
    "applicatorId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "harvestAllowedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "overrideReason" TEXT,
    "overriddenById" TEXT,

    CONSTRAINT "spray_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spray_logs_tenantId_idx" ON "spray_logs"("tenantId");

-- CreateIndex
CREATE INDEX "spray_logs_zoneId_idx" ON "spray_logs"("zoneId");

-- CreateIndex
CREATE INDEX "spray_logs_appliedAt_idx" ON "spray_logs"("appliedAt");

-- AddForeignKey
ALTER TABLE "spray_logs" ADD CONSTRAINT "spray_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spray_logs" ADD CONSTRAINT "spray_logs_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spray_logs" ADD CONSTRAINT "spray_logs_applicatorId_fkey" FOREIGN KEY ("applicatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spray_logs" ADD CONSTRAINT "spray_logs_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
