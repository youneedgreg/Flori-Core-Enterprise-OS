import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { AccountsService } from './accounts.service';
import { CurrencyService } from './currency.service';
import { FinancialsController } from './financials.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialsController],
  providers: [FinancialsService, AccountsService, CurrencyService],
  exports: [FinancialsService, AccountsService, CurrencyService],
})
export class FinancialsModule {}
