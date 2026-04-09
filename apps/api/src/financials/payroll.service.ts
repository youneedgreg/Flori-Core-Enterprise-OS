/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialsService } from './financials.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financials: FinancialsService,
  ) {}

  // ── Employees ──────────────────────────────────────────────────────────────

  async getEmployees(tenantId: string) {
    return (this.prisma as any).employee.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
    });
  }

  async createEmployee(tenantId: string, data: any) {
    return (this.prisma as any).employee.create({
      data: { ...data, tenantId },
    });
  }

  // ── Payroll Runs ────────────────────────────────────────────────────────────

  async getPayrollRuns(tenantId: string) {
    return (this.prisma as any).payrollRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayrollRun(
    tenantId: string,
    data: { year: number; month: number; notes?: string },
  ) {
    const period = `${data.year}-${String(data.month).padStart(2, '0')}`;

    // Check if run already exists
    const existing = await (this.prisma as any).payrollRun.findFirst({
      where: { tenantId, period },
    });
    if (existing)
      throw new BadRequestException(`Payroll run for ${period} already exists`);

    return (this.prisma as any).payrollRun.create({
      data: {
        tenantId,
        runNumber: `PR-${period}-${Math.floor(Math.random() * 1000)}`,
        period,
        year: data.year,
        month: data.month,
        notes: data.notes,
        status: 'DRAFT',
      },
    });
  }

  async processPayroll(tenantId: string, runId: string) {
    const run = await (this.prisma as any).payrollRun.findUnique({
      where: { id: runId, tenantId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'DRAFT')
      throw new BadRequestException('Can only process DRAFT runs');

    // Pull all active employees
    const employees = await (this.prisma as any).employee.findMany({
      where: { tenantId, isActive: true },
    });

    const payslips = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      // SKELETON: Mocking hours from labour logs
      const basicPay = emp.basicSalary;
      const overtime = 0; // TODO: Pull from production labour logs
      const allowances = 0;
      const grossPay = basicPay + overtime + allowances;

      // TODO: Implement Kenya Statutory Deductions (NHIF, NSSF, PAYE)
      const nssf = 0;
      const nhif = 0;
      const paye = 0;

      const deductions = nssf + nhif + paye;
      const netPay = grossPay - deductions;

      payslips.push({
        tenantId,
        payrollRunId: runId,
        employeeId: emp.id,
        basicSalary: basicPay,
        overtime,
        allowances,
        grossPay,
        nssf,
        nhif,
        paye,
        totalDeductions: deductions,
        netPay,
        paymentMethod: emp.mpesaPhone ? 'MPESA' : 'BANK_TRANSFER',
      });

      totalGross += grossPay;
      totalDeductions += deductions;
      totalNet += netPay;
    }

    // Atomic update
    await (this.prisma as any).$transaction([
      (this.prisma as any).payslip.deleteMany({
        where: { payrollRunId: runId },
      }),
      (this.prisma as any).payslip.createMany({ data: payslips }),
      (this.prisma as any).payrollRun.update({
        where: { id: runId },
        data: {
          status: 'PROCESSING',
          totalGross,
          totalDeductions,
          totalNet,
        },
      }),
    ]);

    return { processed: payslips.length, totalNet };
  }

  async approvePayroll(tenantId: string, runId: string, userId: string) {
    const run = await (this.prisma as any).payrollRun.findUnique({
      where: { id: runId, tenantId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');

    const updated = await (this.prisma as any).payrollRun.update({
      where: { id: runId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    // Auto-post to ledger
    try {
      await this.financials.createJournal(tenantId, {
        reference: run.runNumber,
        description: `Payroll for ${run.period}`,
        transactionCurrency: 'KES', // Defaulting to local currency for payroll
        entries: [
          { accountCode: '5100', debit: run.totalGross, credit: 0 }, // Payroll Expense
          { accountCode: '2100', debit: 0, credit: run.totalNet }, // Salaries Payable
          { accountCode: '2200', debit: 0, credit: run.totalDeductions }, // Statutory Payables
        ],
      });
    } catch (e) {
      this.logger.error(
        `Failed to post payroll journal for ${run.runNumber}`,
        e,
      );
    }

    return updated;
  }

  // ── M-Pesa Disbursement (Skeleton) ──────────────────────────────────────────

  async disburseMpesa(tenantId: string, runId: string) {
    // TODO: Integrate with Safaricom B2C API
    this.logger.log(`Initiating M-Pesa bulk disbursement for run ${runId}`);

    return (this.prisma as any).payrollRun.update({
      where: { id: runId, tenantId },
      data: {
        status: 'DISBURSED',
        disbursedAt: new Date(),
      },
    });
  }
}
