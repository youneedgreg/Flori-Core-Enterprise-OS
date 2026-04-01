/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@Controller('telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('latest')
  async getLatest(@Req() req: AuthenticatedRequest) {
    return this.telemetryService.getLatestReadings(req.tenantId);
  }

  @Get('history/:deviceId')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Param('deviceId') deviceId: string,
    @Query('sensorType') sensorType: string,
    @Query('interval') interval?: string,
  ) {
    if (interval) {
      return this.telemetryService.findHistoryBucketed(
        req.tenantId,
        deviceId,
        sensorType,
        interval,
      );
    }
    return this.telemetryService.findHistory(req.tenantId, deviceId);
  }
}
