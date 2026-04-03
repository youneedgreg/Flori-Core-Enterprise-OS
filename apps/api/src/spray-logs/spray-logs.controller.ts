/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Response,
} from '@nestjs/common';
import { SprayLogsService } from './spray-logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request, Response as Res } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('spray-logs')
export class SprayLogsController {
  constructor(private readonly sprayLogsService: SprayLogsService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      zoneId: string;
      chemicalName: string;
      epaRegNo: string;
      quantity: number;
      unit: string;
      phiDays: number;
      applicatorId: string;
      appliedAt?: string;
      notes?: string;
    },
  ) {
    return this.sprayLogsService.create(req.tenantId, data);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('zoneId') zoneId?: string,
  ): Promise<any[]> {
    return this.sprayLogsService.findAll(req.tenantId, { zoneId });
  }

  @Get('active-phi')
  async findActivePhi(
    @Req() req: AuthenticatedRequest,
    @Query('zoneId') zoneId: string,
  ): Promise<any[]> {
    return this.sprayLogsService.findActivePhiByZone(req.tenantId, zoneId);
  }

  @Get('export')
  async export(
    @Req() req: AuthenticatedRequest,
    @Response() res: Res,
  ): Promise<void> {
    const csvContent = await this.sprayLogsService.exportToCsv(req.tenantId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=spray_compliance_${new Date().toISOString().split('T')[0]}.csv`,
    );

    res.status(200).send(csvContent);
  }
}
