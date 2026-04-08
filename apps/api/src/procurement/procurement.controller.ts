/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProcurementService } from './procurement.service';
import { EmailService } from '../communications/email.service';
import { PurchaseRequestStatus, PurchaseOrderStatus } from '@prisma/client';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: any;
}

@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(
    private readonly procurement: ProcurementService,
    private readonly emailService: EmailService,
  ) {}

  // ── Vendors ────────────────────────────────────────────────────────────────

  @Get('vendors')
  getVendors(@Req() req: AuthenticatedRequest) {
    return this.procurement.getVendors(req.tenantId);
  }

  @Post('vendors')
  createVendor(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.procurement.createVendor(req.tenantId, body);
  }

  @Patch('vendors/:id')
  updateVendor(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.procurement.updateVendor(req.tenantId, id, body);
  }

  @Delete('vendors/:id')
  deleteVendor(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurement.deleteVendor(req.tenantId, id);
  }

  // ── Purchase Requests ──────────────────────────────────────────────────────

  @Get('purchase-requests')
  getPurchaseRequests(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: PurchaseRequestStatus,
  ) {
    return this.procurement.getPurchaseRequests(req.tenantId, status);
  }

  @Post('purchase-requests')
  createManualPr(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const userId = req.user?.id as string;
    return this.procurement.createManualPurchaseRequest(req.tenantId, userId, body);
  }

  @Post('purchase-requests/:id/approve')
  async approvePr(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user?.id as string;
    return this.procurement.approvePurchaseRequest(
      req.tenantId,
      id,
      userId,
      body,
      this.emailService,
    );
  }

  @Post('purchase-requests/:id/reject')
  rejectPr(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user?.id as string;
    return this.procurement.rejectPurchaseRequest(req.tenantId, id, userId, body);
  }

  // ── Purchase Orders ────────────────────────────────────────────────────────

  @Get('purchase-orders')
  getPurchaseOrders(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: PurchaseOrderStatus,
  ) {
    return this.procurement.getPurchaseOrders(req.tenantId, status);
  }

  @Patch('purchase-orders/:id/status')
  updatePoStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: PurchaseOrderStatus,
  ) {
    return this.procurement.updatePoStatus(req.tenantId, id, status);
  }

  // ── Manual scan trigger (for testing / on-demand) ──────────────────────────

  @Post('scan/trigger')
  triggerScan() {
    return this.procurement.runLowStockScan();
  }
}
