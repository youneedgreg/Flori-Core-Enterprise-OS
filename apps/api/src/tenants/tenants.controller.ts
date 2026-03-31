/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('settings')
  async getSettings(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.tenantsService.getSettings(tenantId);
  }

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() settings: any) {
    const tenantId = req.user.tenantId;
    return this.tenantsService.updateSettings(tenantId, settings);
  }
}
