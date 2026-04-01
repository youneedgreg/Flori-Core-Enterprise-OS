import { Module } from '@nestjs/common';
import { CropSchedulesService } from './crop-schedules.service';
import { CropSchedulesController } from './crop-schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CropSchedulesController],
  providers: [CropSchedulesService],
  exports: [CropSchedulesService],
})
export class CropSchedulesModule {}
