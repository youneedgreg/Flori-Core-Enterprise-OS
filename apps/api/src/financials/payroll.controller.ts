import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PayrollService } from './payroll.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { sub: string };
}

@UseGuards(JwtAuthGuard)
@Controller('financials/payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ── Employees ──────────────────────────────────────────────────────────────

  @Get('employees')
  getEmployees(@Req() req: AuthenticatedRequest) {
    return this.payrollService.getEmployees(req.tenantId);
  }

  @Post('employees')
  createEmployee(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.payrollService.createEmployee(req.tenantId, data);
  }

  // ── Payroll Runs ────────────────────────────────────────────────────────────

  @Get('runs')
  getRuns(@Req() req: AuthenticatedRequest) {
    return this.payrollService.getPayrollRuns(req.tenantId);
  }

  @Post('runs')
  createRun(
    @Req() req: AuthenticatedRequest,
    @Body() data: { year: number; month: number; notes?: string },
  ) {
    return this.payrollService.createPayrollRun(req.tenantId, data);
  }

  @Post('runs/:id/process')
  processRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payrollService.processPayroll(req.tenantId, id);
  }

  @Patch('runs/:id/approve')
  approveRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payrollService.approvePayroll(req.tenantId, id, req.user.sub);
  }

  // ── Disbursements ───────────────────────────────────────────────────────────

  @Post('runs/:id/disburse/mpesa')
  disburseMpesa(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payrollService.disburseMpesa(req.tenantId, id);
  }
}
