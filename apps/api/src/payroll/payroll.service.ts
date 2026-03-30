import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return await (this.prisma as any).payrollRecord.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { email: true, role: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    data: { userId: string; amount: number; period: string; currency?: string },
  ) {
    return await (this.prisma as any).payrollRecord.create({
      data: {
        ...data,
        tenantId,
        status: 'PENDING',
      },
    });
  }

  async markAsPaid(tenantId: string, id: string) {
    const record = await (this.prisma as any).payrollRecord.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException('Payroll record not found');

    return await (this.prisma as any).payrollRecord.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
      },
    });
  }

  async getSummary(tenantId: string) {
    const records = await (this.prisma as any).payrollRecord.findMany({
      where: { tenantId },
    });

    const totalPaid = records
      .filter((r: any) => r.status === 'PAID')
      .reduce((acc: number, r: any) => acc + r.amount, 0);

    const totalPending = records
      .filter((r: any) => r.status === 'PENDING')
      .reduce((acc: number, r: any) => acc + r.amount, 0);

    return {
      totalPaid,
      totalPending,
      totalStaff: new Set(records.map((r: any) => r.userId)).size,
    };
  }
}
