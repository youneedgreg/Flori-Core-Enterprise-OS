import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';
import { PackingModule } from '../packing/packing.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    CommunicationsModule,
    PackingModule,
    ScheduleModule.forRoot(),
    MulterModule.register({ storage: undefined }), // in-memory (buffer)
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
