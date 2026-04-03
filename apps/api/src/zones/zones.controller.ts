import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZonesService } from './zones.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.zonesService.findAll(req.tenantId);
  }

  @Get('stats')
  getStats(@Req() req: AuthenticatedRequest) {
    return this.zonesService.getZoneStats(req.tenantId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.zonesService.findOne(req.tenantId, id);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() data: { name: string; areaSqm?: number; cropVarieties?: string[] },
  ) {
    return this.zonesService.create(req.tenantId, data);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: { name?: string; areaSqm?: number; cropVarieties?: string[] },
  ) {
    return this.zonesService.update(req.tenantId, id, data);
  }

  @Post('bulk-update')
  bulkUpdate(
    @Req() req: AuthenticatedRequest,
    @Body() data: { ids: string[]; cropVarieties: string[] },
  ) {
    return this.zonesService.bulkUpdateCropVarieties(
      req.tenantId,
      data.ids,
      data.cropVarieties,
    );
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.zonesService.remove(req.tenantId, id);
  }
}
