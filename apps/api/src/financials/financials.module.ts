import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { AccountsService } from './accounts.service';
import { CurrencyService } from './currency.service';
import { ARService } from './ar.service';
import { FinancialsController } from './financials.controller';
import { ARController } from './ar.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialsController, ARController],
  providers: [FinancialsService, AccountsService, CurrencyService, ARService],
  exports: [FinancialsService, AccountsService, CurrencyService, ARService],
})
export class FinancialsModule {}
