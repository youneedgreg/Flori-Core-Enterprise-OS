/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ScoutingReportsService } from './scouting-reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request { user: any; tenantId: string; }

@UseGuards(JwtAuthGuard)
@Controller('farm-operations/scouting-reports')
export class ScoutingReportsController {
  constructor(private readonly service: ScoutingReportsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.service.create(req.tenantId, data);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('zoneId') zoneId?: string,
    @Query('cropCycleId') cropCycleId?: string,
  ) {
    return this.service.findAll(req.tenantId, zoneId, cropCycleId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.findOne(req.tenantId, id);
  }

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() data: any) {
    return this.service.update(req.tenantId, id, data);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.remove(req.tenantId, id);
  }
}
