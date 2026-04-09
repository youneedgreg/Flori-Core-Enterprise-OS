import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
