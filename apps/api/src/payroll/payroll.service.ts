/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabourService } from '../labour/labour.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly labourService: LabourService,
  ) {}

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
    data: {
      userId: string;
      period: string;
      currency?: string;
      type: 'FIXED' | 'HOURLY';
      amount?: number;
      hoursWorked?: number;
      hourlyRate?: number;
      baseAmount?: number;
    },
  ) {
    let finalAmount = data.amount ?? 0;

    if (data.type === 'HOURLY') {
      finalAmount = (data.hoursWorked || 0) * (data.hourlyRate || 0);
    } else if (data.type === 'FIXED') {
      finalAmount = data.baseAmount || data.amount || 0;
    }

    return await (this.prisma as any).payrollRecord.create({
      data: {
        userId: data.userId,
        period: data.period,
        currency: data.currency || 'KES',
        type: data.type,
        amount: finalAmount,
        hoursWorked: data.hoursWorked,
        hourlyRate: data.hourlyRate,
        baseAmount: data.baseAmount,
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

    const totalStaff = new Set(records.map((r: any) => r.userId)).size;

    return {
      totalPaid,
      totalPending,
      totalStaff,
    };
  }

  async createFromLabourLogs(
    tenantId: string,
    userId: string,
    period: string,
    hourlyRate: number,
    startDate: Date,
    endDate: Date,
  ) {
    const hours = await this.labourService.getHoursForPayroll(
      tenantId,
      userId,
      startDate,
      endDate,
    );

    return this.create(tenantId, {
      userId,
      period,
      type: 'HOURLY',
      hoursWorked: hours,
      hourlyRate,
      currency: 'KES',
    });
  }
}
