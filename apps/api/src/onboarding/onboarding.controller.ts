import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import {
  FarmProfileDto,
  ZoneDto,
  InviteTeamMemberDto,
  IoTDeviceDto,
} from './dto/onboarding.dto';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('farm-profile')
  saveFarmProfile(@Req() req: AuthenticatedRequest, @Body() dto: FarmProfileDto) {
    return this.onboardingService.upsertFarmProfile(req.tenantId, dto);
  }

  @Post('zones')
  saveZones(@Req() req: AuthenticatedRequest, @Body() zones: ZoneDto[]) {
    return this.onboardingService.setZones(req.tenantId, zones);
  }

  @Post('invite-team')
  inviteTeam(@Req() req: AuthenticatedRequest, @Body() invites: InviteTeamMemberDto[]) {
    return this.onboardingService.inviteTeamMembers(req.tenantId, invites);
  }

  @Post('iot-devices')
  registerDevices(@Req() req: AuthenticatedRequest, @Body() devices: IoTDeviceDto[]) {
    return this.onboardingService.registerIotDevices(req.tenantId, devices);
  }
}
