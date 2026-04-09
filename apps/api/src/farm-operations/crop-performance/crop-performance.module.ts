import { Module } from '@nestjs/common';
import { CropPerformanceService } from './crop-performance.service';
import { CropPerformanceController } from './crop-performance.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CropPerformanceController],
  providers: [CropPerformanceService],
  exports: [CropPerformanceService],
})
export class CropPerformanceModule {}
