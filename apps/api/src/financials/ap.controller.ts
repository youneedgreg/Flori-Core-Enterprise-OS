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
import { APService } from './ap.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { sub: string };
}

@UseGuards(JwtAuthGuard)
@Controller('financials/ap')
export class APController {
  constructor(private readonly apService: APService) {}

  // ── Vendor Invoices ──────────────────────────────────────────────────────────

  @Get('invoices')
  getInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.apService.getVendorInvoices(req.tenantId, status);
  }

  @Get('invoices/:id')
  getInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apService.getVendorInvoice(req.tenantId, id);
  }

  @Post('invoices')
  createInvoice(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.apService.createVendorInvoice(req.tenantId, data);
  }

  // ── Approval Workflow ────────────────────────────────────────────────────────

  @Patch('invoices/:id/approve')
  approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apService.approveVendorInvoice(req.tenantId, id, req.user.sub);
  }

  @Patch('invoices/:id/reject')
  reject(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.apService.rejectVendorInvoice(
      req.tenantId,
      id,
      req.user.sub,
      reason,
    );
  }

  @Patch('invoices/:id/schedule')
  schedule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('scheduledPayAt') scheduledPayAt: string,
  ) {
    return this.apService.schedulePayment(req.tenantId, id, scheduledPayAt);
  }

  // ── Payments ─────────────────────────────────────────────────────────────────

  @Post('invoices/:id/payments')
  recordPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id') vendorInvoiceId: string,
    @Body() data: any,
  ) {
    return this.apService.recordVendorPayment(
      req.tenantId,
      vendorInvoiceId,
      data,
    );
  }

  // ── 3-Way Match ──────────────────────────────────────────────────────────────

  @Get('invoices/:id/three-way-match')
  threeWayMatch(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.apService.verifyThreeWayMatch(req.tenantId, id);
  }

  // ── Bank Export ──────────────────────────────────────────────────────────────

  @Post('export')
  exportPayments(
    @Req() req: AuthenticatedRequest,
    @Body() data: { vendorInvoiceIds: string[]; format?: 'MT101' | 'CSV' },
  ) {
    return this.apService.exportPaymentFile(
      req.tenantId,
      data.vendorInvoiceIds,
      data.format,
    );
  }
}
