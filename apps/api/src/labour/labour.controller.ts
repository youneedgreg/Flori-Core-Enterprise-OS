/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { LabourService } from './labour.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('labour-logs')
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      userId: string;
      zoneId: string;
      taskType: string;
      hours: number;
      stemsCut?: number;
      gpsLocation?: any;
    },
  ) {
    return this.labourService.create(req.tenantId, data);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('userId') userId?: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.labourService.findAll(req.tenantId, { userId, zoneId });
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.labourService.getProductivityStats(req.tenantId);
  }
}
