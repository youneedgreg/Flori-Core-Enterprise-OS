import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { AccountsService } from './accounts.service';
import { CurrencyService } from './currency.service';
import { ARService } from './ar.service';
import { APService } from './ap.service';
import { BudgetingService } from './budgeting.service';
import { PayrollService } from './payroll.service';
import { FinancialsController } from './financials.controller';
import { ARController } from './ar.controller';
import { APController } from './ap.controller';
import { BudgetingController } from './budgeting.controller';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    FinancialsController,
    ARController,
    APController,
    BudgetingController,
    PayrollController,
  ],
  providers: [
    FinancialsService,
    AccountsService,
    CurrencyService,
    ARService,
    APService,
    BudgetingService,
    PayrollService,
  ],
  exports: [
    FinancialsService,
    AccountsService,
    CurrencyService,
    ARService,
    APService,
    BudgetingService,
    PayrollService,
  ],
})
export class FinancialsModule {}
