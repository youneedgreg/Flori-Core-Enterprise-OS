/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HRService, LeaveRequestInput } from './hr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.controller';
import { EmployeeDocType, LeaveStatus } from '@prisma/client';

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

  // ─── Leave Management ───────────────────────────────────────────────────────

  @Get('leaves')
  async getLeaveRequests(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.hrService.getLeaveRequests(req.user.tenantId, employeeId);
  }

  @Post('leaves')
  async applyForLeave(
    @Req() req: AuthenticatedRequest,
    @Body() data: LeaveRequestInput & { employeeId: string },
  ) {
    // Note: In a real app, we might want to verify employeeId matches the user being onboarded or requested for
    return this.hrService.applyForLeave(
      req.user.tenantId,
      data.employeeId,
      data,
    );
  }

  @Put('leaves/:id/status')
  @Roles('gold_admin', 'hr_manager')
  async updateLeaveStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: LeaveStatus,
  ) {
    return this.hrService.updateLeaveStatus(
      req.user.tenantId,
      id,
      status,
      req.user.id,
    );
  }

  // ─── Shift Scheduling ───────────────────────────────────────────────────────

  @Get('shifts')
  async getShifts(@Req() req: AuthenticatedRequest) {
    return this.hrService.getShifts(req.user.tenantId);
  }

  @Post('shifts')
  @Roles('gold_admin', 'hr_manager')
  async createShift(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.hrService.createShift(req.user.tenantId, data);
  }

  @Get('shifts/assignments')
  async getShiftAssignments(
    @Req() req: AuthenticatedRequest,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.hrService.getShiftAssignments(req.user.tenantId, start, end);
  }

  @Post('shifts/assign')
  @Roles('gold_admin', 'hr_manager')
  async assignShift(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.hrService.assignShift(
      req.user.tenantId,
      data.employeeId,
      data.shiftId,
      data.date,
    );
  }

  @Delete('shifts/assignments/:id')
  @Roles('gold_admin', 'hr_manager')
  async deleteShiftAssignment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.hrService.deleteShiftAssignment(req.user.tenantId, id);
  }
}

// Simple placeholder for ApiTags decorator if Swagger is not fully configured
function ApiTags(_name: string) {
  return (_constructor: Function) => {};
}
