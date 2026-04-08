import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { ProcurementScheduler } from './procurement.scheduler';
import { NotificationService } from '../communications/notification.service';
import { NotificationsGateway } from '../communications/notifications.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CommunicationsModule,
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService, ProcurementScheduler, NotificationService, NotificationsGateway],
  exports: [ProcurementService],
})
export class ProcurementModule {}
