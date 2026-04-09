/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request as Req,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import * as salesService_1 from './sales.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LeadStatus, OrderStatus } from '@prisma/client';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: salesService_1.SalesService) {}

  @Get('customers')
  async getCustomers(@Req() req: ExpressRequest) {
    const tenantId = (req as any).user.tenantId;
    return this.salesService.getCustomers(tenantId);
  }

  @Get('customers/:id')
  async getCustomer(@Req() req: ExpressRequest, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.salesService.getCustomer(tenantId, id);
  }

  @Post('customers')
  async createCustomer(
    @Req() req: ExpressRequest,
    @Body() dto: salesService_1.CreateCustomerDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.createCustomer(tenantId, dto);
  }

  @Put('customers/:id')
  async updateCustomer(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: Partial<salesService_1.CreateCustomerDto>,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.updateCustomer(tenantId, id, dto);
  }

  @Get('leads')
  async getLeads(@Req() req: ExpressRequest) {
    const tenantId = req.user.tenantId;
    return this.salesService.getLeads(tenantId);
  }

  @Post('leads')
  async createLead(
    @Req() req: ExpressRequest,
    @Body() dto: salesService_1.CreateLeadDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.createLead(tenantId, dto);
  }

  @Put('leads/:id/status')
  async updateLeadStatus(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body('status') status: LeadStatus,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.updateLeadStatus(tenantId, id, status);
  }

  @Post('contact-logs')
  async createContactLog(
    @Req() req: ExpressRequest,
    @Body() dto: salesService_1.CreateContactLogDto,
  ) {
    const user = req.user;
    return this.salesService.createContactLog(user.tenantId, user.userId, dto);
  }

  @Get('customers/:id/timeline')
  async getCrmTimeline(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.getCrmTimeline(tenantId, id);
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  @Get('orders/templates')
  async getOrderTemplates(@Req() req: ExpressRequest) {
    const tenantId = req.user.tenantId;
    return this.salesService.getOrderTemplates(tenantId);
  }

  @Post('orders/templates/:id/generate')
  async generateOrderFromTemplate(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.generateOrderFromTemplate(tenantId, id);
  }

  @Get('orders')
  async getOrders(
    @Req() req: ExpressRequest,
    @Query('status') status?: OrderStatus,
    @Query('type') type?: salesService_1.GetOrdersFilterDto['type'],
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.getOrders(tenantId, { status, type });
  }

  @Post('orders')
  async createOrder(
    @Req() req: ExpressRequest,
    @Body() dto: salesService_1.CreateOrderDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.createOrder(tenantId, dto);
  }

  @Get('orders/:id')
  async getOrder(@Req() req: ExpressRequest, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.salesService.getOrder(tenantId, id);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    const tenantId = req.user.tenantId;
    return this.salesService.updateOrderStatus(tenantId, id, status);
  }
}
