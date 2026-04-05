/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import * as packingService from './packing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
@Controller('packing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackingController {
  constructor(private readonly packingService: packingService.PackingService) {}

  @Post('pack')
  @Roles('gold_admin', 'qc_lead')
  async packBox(@Request() req: any, @Body() data: packingService.PackBoxDto) {
    return this.packingService.packBox(req.tenantId, data);
  }

  @Get('boxes')
  @Roles('gold_admin', 'qc_lead', 'store_manager')
  async getBoxes(@Request() req: any) {
    return this.packingService.getPackedBoxes(req.tenantId);
  }
}
