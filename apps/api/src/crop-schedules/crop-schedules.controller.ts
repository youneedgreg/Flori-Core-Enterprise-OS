import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CropSchedulesService } from './crop-schedules.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('crop-schedules')
export class CropSchedulesController {
  constructor(private readonly cropSchedulesService: CropSchedulesService) {}

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('cropCycleId') cropCycleId?: string,
  ) {
    return this.cropSchedulesService.findAll(req.tenantId, cropCycleId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.cropSchedulesService.findOne(req.tenantId, id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.cropSchedulesService.create(req.tenantId, data);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.cropSchedulesService.update(req.tenantId, id, data);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.cropSchedulesService.remove(req.tenantId, id);
  }
}
