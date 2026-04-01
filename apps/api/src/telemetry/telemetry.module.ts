import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryGateway } from './telemetry.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';
import { AutomationRulesModule } from '../automation-rules/automation-rules.module';

@Module({
  imports: [PrismaModule, AlertsModule, AutomationRulesModule],
  providers: [TelemetryService, TelemetryGateway],
  exports: [TelemetryService, TelemetryGateway],
})
export class TelemetryModule {}
