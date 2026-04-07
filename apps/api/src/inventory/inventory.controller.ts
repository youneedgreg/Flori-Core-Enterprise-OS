import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
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

  @Get('atp')
  getATP(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getFinishedGoodsATP(req.user.tenantId);
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
