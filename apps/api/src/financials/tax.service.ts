/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaxRates(tenantId: string) {
    return (this.prisma as any).taxRate.findMany({
      where: { tenantId, isActive: true },
    });
  }

  async createTaxRate(
    tenantId: string,
    data: { name: string; rate: number; type: any },
  ) {
    return (this.prisma as any).taxRate.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async getTaxRate(tenantId: string, id: string) {
    const rate = await (this.prisma as any).taxRate.findFirst({
      where: { id, tenantId },
    });
    if (!rate) throw new NotFoundException('Tax rate not found');
    return rate;
  }
}
