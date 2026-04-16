/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ComplianceService,
  CreateCertificationDto,
} from './compliance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Response as ExpressResponse } from 'express';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.complianceService.getComplianceStats(req.user.tenantId);
  }

  @Get('spray-logs')
  async getSprayLogs(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.complianceService.getSprayLogs(req.user.tenantId, from, to);
  }

  @Get('labour-logs')
  async getLabourLogs(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.complianceService.getLabourLogs(req.user.tenantId, from, to);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.complianceService.getAuditLogs(req.user.tenantId, from, to);
  }

  @Get('certifications')
  async getCertifications(@Req() req: any) {
    return this.complianceService.getCertifications(req.user.tenantId);
  }

  @Post('certifications')
  async createCertification(
    @Req() req: any,
    @Body() dto: CreateCertificationDto,
  ) {
    return this.complianceService.createCertification(req.user.tenantId, dto);
  }

  @Put('certifications/:id')
  async updateCertification(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCertificationDto>,
  ) {
    return this.complianceService.updateCertification(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete('certifications/:id')
  async deleteCertification(@Req() req: any, @Param('id') id: string) {
    return this.complianceService.deleteCertification(req.user.tenantId, id);
  }

  @Post('certifications/:id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertFile(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ) {
    return this.complianceService.uploadCertFile(
      req.user.tenantId,
      id,
      file.buffer,
      file.originalname,
    );
  }

  @Get('audit-report')
  async generateAuditReport(
    @Req() req: any,
    @Res() res: ExpressResponse,
    @Query('type')
    type: 'SPRAY_LOG' | 'LABOUR' | 'FULL_COMPLIANCE' = 'FULL_COMPLIANCE',
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    const { buffer, filename } =
      await this.complianceService.generateAuditReport(
        req.user.tenantId,
        type,
        dateFrom,
        dateTo,
      );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
