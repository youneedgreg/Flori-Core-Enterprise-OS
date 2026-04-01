/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationRulesService {
  private readonly logger = new Logger(AutomationRulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      name: string;
      zoneId?: string;
      sensorType: string;
      operator: string;
      threshold: number;
      action: string;
      isActive?: boolean;
    },
  ) {
    return await (this.prisma as any).automationRule.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return await (this.prisma as any).automationRule.findMany({
      where: { tenantId },
    });
  }

  async findActiveRules(tenantId: string, sensorType: string) {
    return await (this.prisma as any).automationRule.findMany({
      where: {
        tenantId,
        sensorType,
        isActive: true,
      },
    });
  }

  async evaluate(
    tenantId: string,
    deviceId: string,
    sensorType: string,
    value: number,
  ) {
    const rules = await this.findActiveRules(tenantId, sensorType);
    const triggeredActions: string[] = [];

    for (const rule of rules) {
      let isTriggered = false;
      switch (rule.operator) {
        case 'LT':
          isTriggered = value < rule.threshold;
          break;
        case 'GT':
          isTriggered = value > rule.threshold;
          break;
        case 'EQ':
          isTriggered = Math.abs(value - rule.threshold) < 0.01;
          break;
      }

      if (isTriggered) {
        this.logger.warn(
          `Rule triggered: ${rule.name} for ${sensorType} value ${value}`,
        );
        triggeredActions.push(rule.action);
      }
    }

    return triggeredActions;
  }
}
