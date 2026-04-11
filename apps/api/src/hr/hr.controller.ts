/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HRService } from './hr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.controller';
import { EmployeeDocType } from '@prisma/client';

@ApiTags('HR')
@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRController {
  constructor(private readonly hrService: HRService) {}

  @Get('employees')
  async getEmployees(@Req() req: AuthenticatedRequest) {
    return this.hrService.getEmployees(req.user.tenantId);
  }

  @Get('employees/:id')
  async getEmployeeProfile(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.hrService.getEmployeeProfile(req.user.tenantId, id);
  }

  @Post('employees')
  @Roles('gold_admin', 'hr_manager')
  async createEmployee(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.hrService.createEmployee(req.user.tenantId, data);
  }

  @Put('employees/:id')
  @Roles('gold_admin', 'hr_manager')
  async updateEmployee(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.hrService.updateEmployee(req.user.tenantId, id, data);
  }

  @Post('employees/:id/documents')
  @Roles('gold_admin', 'hr_manager')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('type') type: EmployeeDocType,
    @Body('documentNumber') documentNumber: string,
    @Body('expiryDate') expiryDate: string,
    @UploadedFile() file: any,
  ) {
    return this.hrService.uploadDocument(
      req.user.tenantId,
      id,
      type,
      documentNumber,
      expiryDate,
      file,
    );
  }

  @Get('alerts/expiring-docs')
  async getExpiringDocs(
    @Req() req: AuthenticatedRequest,
    @Query('days') days?: string,
  ) {
    return this.hrService.getExpiringDocuments(
      req.user.tenantId,
      days ? parseInt(days) : 30,
    );
  }

  @Post('alerts/check-expiries')
  @Roles('gold_admin')
  async triggerExpiryChecks(@Req() req: AuthenticatedRequest) {
    const count = await this.hrService.notifyExpiries(req.user.tenantId);
    return { notified: count };
  }
}

// Simple placeholder for ApiTags decorator if Swagger is not fully configured
function ApiTags(_name: string) {
  return (_constructor: Function) => {};
}
