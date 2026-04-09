import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ARService } from './ar.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('financials/ar')
export class ARController {
  constructor(private readonly arService: ARService) {}

  // ── Invoices ──────────────────────────────────────────────────────────────────

  @Get('invoices')
  getInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.arService.getInvoices(req.tenantId, status);
  }

  @Get('invoices/:id')
  getInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.arService.getInvoice(req.tenantId, id);
  }

  @Patch('invoices/:id/send')
  markSent(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.arService.markSent(req.tenantId, id);
  }

  // ── Payments ──────────────────────────────────────────────────────────────────

  @Post('invoices/:id/payments')
  recordPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id') invoiceId: string,
    @Body()
    data: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
      paidAt?: string;
    },
  ) {
    return this.arService.recordPayment(req.tenantId, invoiceId, data);
  }

  // ── Credit Limit ──────────────────────────────────────────────────────────────

  @Get('credit-check/:customerId')
  checkCredit(
    @Req() req: AuthenticatedRequest,
    @Param('customerId') customerId: string,
    @Query('amount') amount: string,
  ) {
    return this.arService.checkCreditLimit(
      req.tenantId,
      customerId,
      parseFloat(amount ?? '0'),
    );
  }

  // ── Aging Report ──────────────────────────────────────────────────────────────

  @Get('aging')
  getAgingReport(@Req() req: AuthenticatedRequest) {
    return this.arService.getAgingReport(req.tenantId);
  }

  // ── Reminder Processing (hook for cron or manual UI trigger) ─────────────────

  @Post('reminders/process')
  processReminders(@Req() req: AuthenticatedRequest) {
    return this.arService.processReminders(req.tenantId);
  }
}
