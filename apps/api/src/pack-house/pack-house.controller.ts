/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PackHouseService } from './pack-house.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('pack-house')
export class PackHouseController {
  constructor(private readonly packHouseService: PackHouseService) {}

  @Post('intake')
  createIntake(
    @Req() req: AuthenticatedRequest,
    @Body() data: { cropCycleId: string; quantity: number },
  ) {
    return this.packHouseService.createIntake(req.tenantId, data);
  }

  @Post('grading/:id')
  submitQC(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: {
      stemLength: number;
      bloomStage: string;
      headDiameter: number;
      defects: string[];
      notes?: string;
    },
  ) {
    return this.packHouseService.submitQC(req.tenantId, id, data);
  }

  @Get('batches')
  getBatches(@Req() req: AuthenticatedRequest) {
    return this.packHouseService.getBatches(req.tenantId);
  }

  @Get('batches/:id')
  getBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.packHouseService.getBatch(req.tenantId, id);
  }

  @Get('inventory')
  getInventory(@Req() req: AuthenticatedRequest) {
    return this.packHouseService.getInventory(req.tenantId);
  }
}
