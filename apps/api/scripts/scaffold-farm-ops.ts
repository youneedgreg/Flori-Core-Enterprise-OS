import * as fs from 'fs';
import * as path from 'path';

const modules = [
  { dir: 'soil-tests', model: 'soilTest', name: 'SoilTests' },
  { dir: 'land-prep', model: 'landPrepLog', name: 'LandPrep' },
  { dir: 'crop-budgets', model: 'cropBudget', name: 'CropBudgets' },
  { dir: 'planting-records', model: 'plantingRecord', name: 'PlantingRecords' },
  { dir: 'irrigation-logs', model: 'irrigationLog', name: 'IrrigationLogs' },
  { dir: 'scouting-reports', model: 'scoutingReport', name: 'ScoutingReports' },
  {
    dir: 'crop-performance',
    model: 'cropPerformanceLog',
    name: 'CropPerformance',
  },
  { dir: 'pre-harvest', model: 'preHarvestQualityLog', name: 'PreHarvest' },
  { dir: 'harvest-records', model: 'harvestRecord', name: 'HarvestRecords' },
];

const API_PATH = path.join(__dirname, '../src/farm-operations');

for (const mod of modules) {
  const servicePath = path.join(API_PATH, mod.dir, `${mod.dir}.service.ts`);
  const controllerPath = path.join(
    API_PATH,
    mod.dir,
    `${mod.dir}.controller.ts`,
  );

  const serviceContent = `/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ${mod.name}Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return await (this.prisma as any).${mod.model}.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return await (this.prisma as any).${mod.model}.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
`;

  const controllerContent = `/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ${mod.name}Service } from './${mod.dir}.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
  tenantId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('farm-operations/${mod.dir}')
export class ${mod.name}Controller {
  constructor(private readonly service: ${mod.name}Service) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.service.create(req.tenantId, data);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.service.findAll(req.tenantId);
  }
}
`;

  fs.writeFileSync(servicePath, serviceContent);
  fs.writeFileSync(controllerPath, controllerContent);
  console.log(`Updated ${mod.dir}`);
}
