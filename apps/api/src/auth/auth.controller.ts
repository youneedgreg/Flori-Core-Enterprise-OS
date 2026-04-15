import { Controller, Post, Body, Get, Req, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { RegisterTenantDto, LoginDto } from '@flori/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: {
      name: string;
    };
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('roles')
  async getRoles(@Req() req: AuthenticatedRequest) {
    return this.authService.getRolesForTenant(req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
