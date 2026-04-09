/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReportingService } from './reporting.service';
import { TaxService } from './tax.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('financials/reports')
export class ReportingController {
  constructor(
    private readonly reportService: ReportingService,
    private readonly taxService: TaxService,
  ) {}

  @Get('pnl')
  async getPnL(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDt = from
      ? new Date(from)
      : new Date(new Date().getFullYear(), 0, 1);
    const toDt = to ? new Date(to) : new Date();
    return this.reportService.getPnL(req.tenantId, fromDt, toDt);
  }

  @Get('balance-sheet')
  async getBalanceSheet(
    @Req() req: AuthenticatedRequest,
    @Query('date') date?: string,
  ) {
    const asOf = date ? new Date(date) : new Date();
    return this.reportService.getBalanceSheet(req.tenantId, asOf);
  }

  @Get('taxes')
  async getTaxReport(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDt = from
      ? new Date(from)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDt = to ? new Date(to) : new Date();
    return this.reportService.getTaxReport(req.tenantId, fromDt, toDt);
  }

  @Get('tax-rates')
  async getTaxRates(@Req() req: AuthenticatedRequest) {
    return this.taxService.getTaxRates(req.tenantId);
  }
}
