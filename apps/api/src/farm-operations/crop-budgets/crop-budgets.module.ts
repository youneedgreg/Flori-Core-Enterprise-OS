import { Module } from '@nestjs/common';
import { CropBudgetsService } from './crop-budgets.service';
import { CropBudgetsController } from './crop-budgets.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CropBudgetsController],
  providers: [CropBudgetsService],
  exports: [CropBudgetsService],
})
export class CropBudgetsModule {}
