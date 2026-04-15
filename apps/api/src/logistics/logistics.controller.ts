/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LogisticsService } from './logistics.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('orders')
  findAllOrders(@Req() req: AuthenticatedRequest) {
    return this.logisticsService.findAll(req.tenantId);
  }

  @Get('orders/:id')
  findOneOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.logisticsService.findOne(req.tenantId, id);
  }

  @Post('orders')
  createOrder(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.logisticsService.create(req.tenantId, data);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.logisticsService.updateStatus(req.tenantId, id, status);
  }

  @Get('customers')
  findAllCustomers(@Req() req: AuthenticatedRequest) {
    return this.logisticsService.findAllCustomers(req.tenantId);
  }

  @Post('customers')
  createCustomer(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.logisticsService.createCustomer(req.tenantId, data);
  }

  // ── Fleet & Routes ────────────────────────────────────────────────────────

  @Get('vehicles')
  getVehicles(@Req() req: AuthenticatedRequest) {
    return this.logisticsService.getVehicles(req.tenantId);
  }

  @Post('vehicles')
  createVehicle(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.logisticsService.createVehicle(req.tenantId, data);
  }

  @Get('routes')
  getRoutes(@Req() req: AuthenticatedRequest) {
    // Note: To filter by driver, we could check req.user.role === 'driver' and pass req.user.id
    // For now, return all routes, frontend can filter.
    return this.logisticsService.getRoutes(req.tenantId);
  }

  @Post('routes')
  createRoute(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      driverId: string;
      vehicleId: string;
      date: string;
      stopOrderIds: string[];
    },
  ) {
    return this.logisticsService.createRoute(
      req.tenantId,
      data.driverId,
      data.vehicleId,
      data.date,
      data.stopOrderIds,
    );
  }

  @Get('drivers')
  getDrivers(@Req() req: AuthenticatedRequest) {
    return this.logisticsService.getDrivers(req.tenantId);
  }

  @Get('routes/:id')
  getRoute(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.logisticsService.getRouteById(req.tenantId, id);
  }

  @Patch('routes/:id/status')
  updateRouteStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.logisticsService.updateRouteStatus(req.tenantId, id, status);
  }

  @Patch('stops/:stopId/status')
  updateStopStatus(
    @Req() req: AuthenticatedRequest,
    @Param('stopId') stopId: string,
    @Body('status') status: string,
  ) {
    return this.logisticsService.updateStopStatus(req.tenantId, stopId, status);
  }

  @Put('vehicles/:id')
  updateVehicle(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.logisticsService.updateVehicle(req.tenantId, id, data);
  }

  @Post('stops/:stopId/pod')
  @UseInterceptors(AnyFilesInterceptor())
  async submitPoD(
    @Req() req: AuthenticatedRequest,
    @Param('stopId') stopId: string,
    @Body('tempAtDelivery') tempAtDelivery: string,
    @UploadedFiles() files: Array<{ fieldname: string; buffer: Buffer }>,
  ) {
    const signatureFile = files?.find((f) => f.fieldname === 'signature');
    const photoFile = files?.find((f) => f.fieldname === 'photo');

    if (!signatureFile) {
      throw new BadRequestException('Signature is required for PoD');
    }

    return this.logisticsService.submitPoD(
      req.tenantId,
      stopId,
      signatureFile.buffer,
      photoFile?.buffer,
      tempAtDelivery,
    );
  }
}
