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
import { BudgetingService } from './budgeting.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('financials/budgeting')
export class BudgetingController {
  constructor(private readonly budgetingService: BudgetingService) {}

  // ── Cost Centres ─────────────────────────────────────────────────────────────

  @Get('cost-centres')
  getCostCentres(@Req() req: AuthenticatedRequest) {
    return this.budgetingService.getCostCentres(req.tenantId);
  }

  @Post('cost-centres')
  createCostCentre(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.budgetingService.createCostCentre(req.tenantId, data);
  }

  // ── Budgets ──────────────────────────────────────────────────────────────────

  @Get('budgets')
  getBudgets(@Req() req: AuthenticatedRequest, @Query('year') year?: string) {
    return this.budgetingService.getBudgets(
      req.tenantId,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('budgets/:id')
  getBudget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.budgetingService.getBudget(req.tenantId, id);
  }

  @Post('budgets')
  createBudget(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.budgetingService.createBudget(req.tenantId, data);
  }

  @Patch('budgets/:id/approve')
  approveBudget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.budgetingService.approveBudget(req.tenantId, id);
  }

  // ── Reports ──────────────────────────────────────────────────────────────────

  @Get('variance')
  getVariance(
    @Req() req: AuthenticatedRequest,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    return this.budgetingService.getVarianceReport(
      req.tenantId,
      parseInt(year ?? String(new Date().getFullYear())),
      month ? parseInt(month) : undefined,
    );
  }

  @Get('pl/departmental')
  getDeptPL(
    @Req() req: AuthenticatedRequest,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    return this.budgetingService.getDepartmentalPL(
      req.tenantId,
      parseInt(year ?? String(new Date().getFullYear())),
      month ? parseInt(month) : undefined,
    );
  }

  @Get('profitability/orders')
  getOrderProfit(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    return this.budgetingService.getOrderProfitability(
      req.tenantId,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('profitability/varieties')
  getVarietyProfit(@Req() req: AuthenticatedRequest) {
    return this.budgetingService.getVarietyProfitability(req.tenantId);
  }
}
