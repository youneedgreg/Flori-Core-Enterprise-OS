import { Module } from '@nestjs/common';
import { LabourService } from './labour.service';
import { LabourController } from './labour.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LabourService],
  controllers: [LabourController],
  exports: [LabourService],
})
export class LabourModule {}
