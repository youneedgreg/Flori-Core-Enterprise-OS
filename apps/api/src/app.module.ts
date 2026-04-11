import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { CommunicationsModule } from './communications/communications.module';
import { OnboardingModule } from './onboarding/onboarding.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { VarietiesModule } from './varieties/varieties.module';
import { CropCyclesModule } from './crop-cycles/crop-cycles.module';
import { CropSchedulesModule } from './crop-schedules/crop-schedules.module';

import { AuditLogModule } from './audit-log/audit-log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

import { ZonesModule } from './zones/zones.module';
import { TeamModule } from './team/team.module';
import { LogisticsModule } from './logistics/logistics.module';
import { PayrollModule } from './payroll/payroll.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AlertsModule } from './alerts/alerts.module';
import { AutomationRulesModule } from './automation-rules/automation-rules.module';
import { MqttModule } from './mqtt/mqtt.module';
import { LabourModule } from './labour/labour.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { SprayLogsModule } from './spray-logs/spray-logs.module';
import { PackHouseModule } from './pack-house/pack-house.module';
import { ColdRoomModule } from './cold-room/cold-room.module';
import { PackingModule } from './packing/packing.module';
import { InventoryModule } from './inventory/inventory.module';
import { StoresModule } from './stores/stores.module';
import { ProcurementModule } from './procurement/procurement.module';
import { FinancialsModule } from './financials/financials.module';
import { SalesModule } from './sales/sales.module';
import { ExportDocsModule } from './export-docs/export-docs.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SoilTestsModule } from './farm-operations/soil-tests/soil-tests.module';
import { LandPrepModule } from './farm-operations/land-prep/land-prep.module';
import { CropBudgetsModule } from './farm-operations/crop-budgets/crop-budgets.module';
import { PlantingRecordsModule } from './farm-operations/planting-records/planting-records.module';
import { IrrigationLogsModule } from './farm-operations/irrigation-logs/irrigation-logs.module';
import { ScoutingReportsModule } from './farm-operations/scouting-reports/scouting-reports.module';
import { CropPerformanceModule } from './farm-operations/crop-performance/crop-performance.module';
import { PreHarvestModule } from './farm-operations/pre-harvest/pre-harvest.module';
import { HarvestRecordsModule } from './farm-operations/harvest-records/harvest-records.module';
import { HRModule } from './hr/hr.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CommunicationsModule,
    OnboardingModule,
    DashboardModule,
    NotificationsModule,
    AuditLogModule,
    ZonesModule,
    TeamModule,
    LogisticsModule,
    PayrollModule,
    TelemetryModule,
    AlertsModule,
    AutomationRulesModule,
    MqttModule,
    LabourModule,
    SuperAdminModule,
    TenantsModule,
    ProductsModule,
    VarietiesModule,
    CropCyclesModule,
    CropSchedulesModule,
    SprayLogsModule,
    PackHouseModule,
    ColdRoomModule,
    PackingModule,
    InventoryModule,
    StoresModule,
    ProcurementModule,
    FinancialsModule,
    SalesModule,
    ExportDocsModule,
    ComplianceModule,
    SoilTestsModule,
    LandPrepModule,
    CropBudgetsModule,
    PlantingRecordsModule,
    IrrigationLogsModule,
    ScoutingReportsModule,
    CropPerformanceModule,
    PreHarvestModule,
    HarvestRecordsModule,
    HRModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
