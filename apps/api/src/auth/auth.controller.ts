import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { RegisterTenantDto, LoginDto } from '@flori/shared';

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
}
