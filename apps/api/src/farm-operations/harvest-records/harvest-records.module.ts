import { Module } from '@nestjs/common';
import { HarvestRecordsService } from './harvest-records.service';
import { HarvestRecordsController } from './harvest-records.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HarvestRecordsController],
  providers: [HarvestRecordsService],
  exports: [HarvestRecordsService],
})
export class HarvestRecordsModule {}
