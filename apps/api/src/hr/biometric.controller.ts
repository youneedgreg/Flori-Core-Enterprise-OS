import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { HRService } from './hr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.controller';

@Controller('hr/biometric')
export class BiometricController {
  constructor(private readonly hrService: HRService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gold_admin', 'hr_manager', 'system_integrator')
  async syncLogs(@Req() req: AuthenticatedRequest, @Body('logs') logs: any[]) {
    if (!Array.isArray(logs)) {
      throw new UnauthorizedException('Invalid payload: expected logs array');
    }
    return this.hrService.syncAttendanceLogs(req.user.tenantId, logs);
  }
}
