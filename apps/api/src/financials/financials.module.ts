import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { AccountsService } from './accounts.service';
import { CurrencyService } from './currency.service';
import { ARService } from './ar.service';
import { APService } from './ap.service';
import { BudgetingService } from './budgeting.service';
import { PayrollService } from './payroll.service';
import { TaxService } from './tax.service';
import { ReportingService } from './reporting.service';
import { FinancialsController } from './financials.controller';
import { ARController } from './ar.controller';
import { APController } from './ap.controller';
import { BudgetingController } from './budgeting.controller';
import { PayrollController } from './payroll.controller';
import { ReportingController } from './reporting.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MpesaService } from './mpesa.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    FinancialsController,
    ARController,
    APController,
    BudgetingController,
    PayrollController,
    ReportingController,
  ],
  providers: [
    FinancialsService,
    AccountsService,
    CurrencyService,
    ARService,
    APService,
    BudgetingService,
    PayrollService,
    TaxService,
    ReportingService,
    MpesaService,
  ],
  exports: [
    FinancialsService,
    AccountsService,
    CurrencyService,
    ARService,
    APService,
    BudgetingService,
    PayrollService,
    TaxService,
    ReportingService,
    MpesaService,
  ],
})
export class FinancialsModule {}
