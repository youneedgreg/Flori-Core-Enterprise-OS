import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LogisticsService } from './logistics.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('orders')
  findAllOrders(@Req() req: AuthenticatedRequest) {
    return this.logisticsService.findAll(req.tenantId);
  }

  @Get('orders/:id')
  findOneOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.logisticsService.findOne(req.tenantId, id);
  }

  @Post('orders')
  createOrder(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.logisticsService.create(req.tenantId, data);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.logisticsService.updateStatus(req.tenantId, id, status);
  }

  @Get('customers')
  findAllCustomers(@Req() req: AuthenticatedRequest) {
    return this.logisticsService.findAllCustomers(req.tenantId);
  }

  @Post('customers')
  createCustomer(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.logisticsService.createCustomer(req.tenantId, data);
  }
}
