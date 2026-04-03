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
import { PayrollService } from './payroll.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.payrollService.findAll(req.tenantId);
  }

  @Get('summary')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.payrollService.getSummary(req.tenantId);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.payrollService.create(req.tenantId, data);
  }

  @Patch(':id/pay')
  markAsPaid(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payrollService.markAsPaid(req.tenantId, id);
  }
}
