/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CropBudgetsService } from './crop-budgets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('farm-operations/crop-budgets')
export class CropBudgetsController {
  constructor(private readonly service: CropBudgetsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.service.create(req.tenantId, data);
  }

  @Put(':cropCycleId/upsert')
  upsert(
    @Req() req: AuthenticatedRequest,
    @Param('cropCycleId') cropCycleId: string,
    @Body() data: any,
  ) {
    return this.service.upsert(req.tenantId, cropCycleId, data);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.service.findAll(req.tenantId);
  }

  @Get('by-cycle/:cropCycleId')
  findByCycle(
    @Req() req: AuthenticatedRequest,
    @Param('cropCycleId') cropCycleId: string,
  ) {
    return this.service.findByCycle(req.tenantId, cropCycleId);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.update(req.tenantId, id, data);
  }
}
