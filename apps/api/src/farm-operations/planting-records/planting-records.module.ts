import { Module } from '@nestjs/common';
import { PlantingRecordsService } from './planting-records.service';
import { PlantingRecordsController } from './planting-records.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlantingRecordsController],
  providers: [PlantingRecordsService],
  exports: [PlantingRecordsService],
})
export class PlantingRecordsModule {}
