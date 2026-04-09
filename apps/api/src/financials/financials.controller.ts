import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FinancialsService } from './financials.service';
import { AccountsService } from './accounts.service';
import { CurrencyService } from './currency.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('financials')
export class FinancialsController {
  constructor(
    private readonly financialsService: FinancialsService,
    private readonly accountsService: AccountsService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Get('journals')
  getJournals(@Req() req: AuthenticatedRequest) {
    return this.financialsService.getJournals(req.tenantId);
  }

  // ── Chart of Accounts ───────────────────────────────────────────────────────

  @Get('accounts')
  getAccounts(@Req() req: AuthenticatedRequest) {
    return this.accountsService.getAccounts(req.tenantId);
  }

  @Post('accounts')
  createAccount(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.accountsService.createAccount(req.tenantId, data);
  }

  // ── Currency Settings ───────────────────────────────────────────────────────

  @Get('settings/currency')
  async getCurrency(@Req() req: AuthenticatedRequest) {
    return {
      baseCurrency: await this.currencyService.getTenantBaseCurrency(
        req.tenantId,
      ),
    };
  }

  @Patch('settings/currency')
  async updateCurrency(
    @Req() req: AuthenticatedRequest,
    @Body('currency') currency: string,
  ) {
    return await this.currencyService.updateTenantBaseCurrency(
      req.tenantId,
      currency,
    );
  }
}
