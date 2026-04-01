/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AutomationRulesService } from './automation-rules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@Controller('automation-rules')
@UseGuards(JwtAuthGuard)
export class AutomationRulesController {
  constructor(private readonly rulesService: AutomationRulesService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest): Promise<any[]> {
    return this.rulesService.findAll(req.tenantId);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      name: string;
      zoneId?: string;
      sensorType: string;
      operator: string;
      threshold: number;
      action: string;
    },
  ): Promise<any> {
    return this.rulesService.create(req.tenantId, data);
  }
}
