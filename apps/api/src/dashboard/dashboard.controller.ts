import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId?: string;
  user?: any;
}

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Req() req: AuthenticatedRequest) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-member-access
    const tenantId = req.tenantId || (req.user as any)?.tenantId;
    console.log(`[DashboardController] getStats called. tenantId: ${tenantId}`);
    return this.dashboardService.getStats(tenantId);
  }
}
