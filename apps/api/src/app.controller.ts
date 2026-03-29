import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('flori-core-users')
  async getSystemUsers(@Headers('x-superadmin-password') pass: string) {
    if (pass !== '12password') {
      throw new UnauthorizedException('Invalid system admin credentials');
    }
    return this.appService.getSystemUsers();
  }
}
