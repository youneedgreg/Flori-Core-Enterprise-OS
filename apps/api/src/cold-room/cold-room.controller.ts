/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ColdRoomService } from './cold-room.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: any;
}

@Controller('cold-room')
@UseGuards(JwtAuthGuard)
export class ColdRoomController {
  constructor(private readonly coldRoomService: ColdRoomService) {}

  @Get('zones')
  async getColdRooms(@Req() req: AuthenticatedRequest) {
    return this.coldRoomService.getColdRooms(req.tenantId);
  }

  @Get('inventory')
  async getInventory(@Req() req: AuthenticatedRequest) {
    return this.coldRoomService.getInventory(req.tenantId);
  }

  @Get('telemetry/:zoneId')
  async getTelemetry(
    @Req() req: AuthenticatedRequest,
    @Param('zoneId') zoneId: string,
  ) {
    return this.coldRoomService.getZoneTelemetry(req.tenantId, zoneId);
  }

  @Post('events')
  async recordEvent(
    @Req() req: AuthenticatedRequest,
    @Body() data: any,
  ) {
    // Note: Assuming req.user.id is available from JwtAuthGuard
    const userId = req.user?.id;
    return this.coldRoomService.recordEvent(req.tenantId, userId, data);
  }
}
