import { Module } from '@nestjs/common';
import { CropCyclesService } from './crop-cycles.service';
import { CropCyclesController } from './crop-cycles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SprayLogsModule } from '../spray-logs/spray-logs.module';

@Module({
  imports: [PrismaModule, SprayLogsModule],
  controllers: [CropCyclesController],
  providers: [CropCyclesService],
  exports: [CropCyclesService],
})
export class CropCyclesModule {}
