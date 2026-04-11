import { Module } from '@nestjs/common';
import { HRService } from './hr.service';
import { HRController } from './hr.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PackingModule } from '../packing/packing.module'; // for StorageService
import { CommunicationsModule } from '../communications/communications.module'; // for NotificationService

@Module({
  imports: [PrismaModule, PackingModule, CommunicationsModule],
  controllers: [HRController],
  providers: [HRService],
  exports: [HRService],
})
export class HRModule {}
