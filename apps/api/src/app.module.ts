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
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';

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
    SuperAdminModule,
    TenantsModule,
    ProductsModule,
    VarietiesModule,
    CropCyclesModule,
    CropSchedulesModule,
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
