import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeamService } from './team.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.teamService.findAll(req.tenantId);
  }

  @Get('roles')
  getRoles(@Req() req: AuthenticatedRequest) {
    return this.teamService.getRoles(req.tenantId);
  }

  @Post('invite')
  invite(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { email: string; roleId: string },
  ) {
    return this.teamService.inviteMember(req.tenantId, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.teamService.removeMember(req.tenantId, id);
  }
}
