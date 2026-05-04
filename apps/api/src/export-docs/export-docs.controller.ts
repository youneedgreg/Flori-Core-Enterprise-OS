/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request as Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExportDocsService } from './export-docs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportDocType } from '@prisma/client';

@Controller('export-docs')
@UseGuards(JwtAuthGuard)
export class ExportDocsController {
  constructor(private readonly exportDocsService: ExportDocsService) {}

  @Get('order/:orderId')
  async getDocumentsByOrder(
    @Req() req: any,
    @Param('orderId') orderId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.exportDocsService.getDocumentsByOrder(tenantId, orderId);
  }

  @Post('order/:orderId/generate')
  async generateDocument(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body('type') type: ExportDocType,
    @Body('notes') notes?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.exportDocsService.generateDocument(
      tenantId,
      orderId,
      type,
      notes,
    );
  }

  @Post('order/:orderId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @UploadedFile() file: any,
    @Body('type') type: ExportDocType,
    @Body('notes') notes?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.exportDocsService.uploadDocument(
      tenantId,
      orderId,
      file,
      type,
      notes,
    );
  }

  @Post(':docId/email')
  async emailDocument(
    @Req() req: any,
    @Param('docId') docId: string,
    @Body('to') to: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.exportDocsService.emailDocument(tenantId, docId, to);
  }
}
