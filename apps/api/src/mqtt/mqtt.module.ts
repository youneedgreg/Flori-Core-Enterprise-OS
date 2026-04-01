import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IotController } from './iot.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { AutomationRulesModule } from '../automation-rules/automation-rules.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => TelemetryModule),
    AlertsModule,
    AutomationRulesModule,
  ],
  controllers: [IotController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
