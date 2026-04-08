/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoresService } from './stores.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: any;
}

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ── Farm currency ─────────────────────────────────────────────────────────

  @Get('currency')
  getFarmCurrency(@Req() req: AuthenticatedRequest) {
    return this.storesService
      .getFarmCurrency(req.tenantId)
      .then((c) => ({ currency: c }));
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  @Get('items')
  getItems(@Req() req: AuthenticatedRequest) {
    return this.storesService.getItems(req.tenantId);
  }

  @Post('items')
  createItem(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.storesService.createItem(req.tenantId, body);
  }

  @Patch('items/:id')
  updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.storesService.updateItem(req.tenantId, id, body);
  }

  // ── Stock ─────────────────────────────────────────────────────────────────

  @Get('stock')
  getStock(@Req() req: AuthenticatedRequest) {
    return this.storesService.getStock(req.tenantId);
  }

  @Get('alerts')
  getLowStockAlerts(@Req() req: AuthenticatedRequest) {
    return this.storesService.getLowStockAlerts(req.tenantId);
  }

  // ── Movements ─────────────────────────────────────────────────────────────

  @Get('movements')
  getMovements(
    @Req() req: AuthenticatedRequest,
    @Query('itemId') itemId?: string,
  ) {
    return this.storesService.getMovements(req.tenantId, itemId);
  }

  @Post('movements')
  recordMovement(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const userId = req.user?.id as string | undefined;
    return this.storesService.recordMovement(req.tenantId, body, userId);
  }
}
