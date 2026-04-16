import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: {
    id: string;
    tenantId: string;
    [key: string]: any;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── Summary KPIs ─────────────────────────────────────────────────────────────
  @Get('summary')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getSummary(req.user.tenantId);
  }

  // ── ATP ───────────────────────────────────────────────────────────────────────
  @Get('atp')
  getATP(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getFinishedGoodsATP(req.user.tenantId);
  }

  // ── Packed Boxes ──────────────────────────────────────────────────────────────
  @Get('boxes')
  getBoxes(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('varietyId') varietyId?: string,
  ) {
    return this.inventoryService.getPackedBoxes(req.user.tenantId, status, varietyId);
  }

  // ── Raw Stem Inventory ────────────────────────────────────────────────────────
  @Get('flower-inventory')
  getFlowerInventory(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getFlowerInventory(req.user.tenantId);
  }

  @Patch('flower-inventory/:id/adjust')
  adjustFlowerInventory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: { quantity: number; notes?: string },
  ) {
    return this.inventoryService.adjustFlowerInventory(req.user.tenantId, id, data.quantity, data.notes);
  }

  // ── Wastage ───────────────────────────────────────────────────────────────────
  @Get('wastage')
  getWastageLogs(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getWastageLogs(req.user.tenantId);
  }

  @Post('wastage')
  recordWastage(
    @Req() req: AuthenticatedRequest,
    @Body() data: import('./inventory.service').WastageDto,
  ) {
    return this.inventoryService.recordWastage(
      req.user.tenantId,
      data,
      req.user.id,
    );
  }

  // ── Box Allocation ────────────────────────────────────────────────────────────
  @Post('allocate/:orderId')
  allocateBoxes(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Body('boxIds') boxIds: string[],
  ) {
    return this.inventoryService.allocateBoxesToOrder(
      req.user.tenantId,
      orderId,
      boxIds,
    );
  }
}
