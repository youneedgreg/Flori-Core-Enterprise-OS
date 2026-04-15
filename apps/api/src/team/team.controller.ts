import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeamService } from './team.service';
import type { InviteMemberDto, UpdateMemberDto } from './team.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { id: string; email: string; tenantId: string; role: { name: string } };
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

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.teamService.findOne(req.tenantId, id);
  }

  @Post('invite')
  invite(
    @Req() req: AuthenticatedRequest,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamService.inviteMember(req.tenantId, dto);
  }

  @Put(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.teamService.updateMember(req.tenantId, id, dto);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.teamService.resetPassword(req.tenantId, id);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.teamService.removeMember(req.tenantId, id, req.user.id);
  }
}
