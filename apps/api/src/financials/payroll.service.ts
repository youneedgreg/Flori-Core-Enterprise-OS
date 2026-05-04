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
import { MpesaService } from './mpesa.service';
import { calculateNssf, calculateShif, calculatePaye } from './tax-engine';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';
import { join } from 'path';
import { createWriteStream } from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financials: FinancialsService,
    private readonly mpesaService: MpesaService,
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

    const startOfMonth = new Date(run.year, run.month - 1, 1);
    const endOfMonth = new Date(run.year, run.month, 0, 23, 59, 59);

    // Pull all active employees
    const employees = await (this.prisma as any).employee.findMany({
      where: { tenantId, isActive: true },
    });

    const payslips = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      let loggedHours = 0;
      if (emp.userId) {
        const logs = await (this.prisma as any).labourLog.aggregate({
          where: {
            tenantId,
            userId: emp.userId,
            timestamp: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { hours: true },
        });
        loggedHours = logs._sum.hours || 0;
      }

      let basicPay = emp.basicSalary || 0;
      let overtime = 0;

      // Casual vs Permanent calculation
      if (emp.employmentType === 'CASUAL') {
        const hourlyRate = basicPay > 0 ? basicPay / 173.33 : 0;
        basicPay = loggedHours * hourlyRate;
      } else {
        if (loggedHours > 173.33) {
          const hourlyRate = basicPay > 0 ? basicPay / 173.33 : 0;
          overtime = (loggedHours - 173.33) * (hourlyRate * 1.5);
        }
      }

      const allowances = 0;
      const grossPay = basicPay + overtime + allowances;

      // Kenya Statutory Deductions (NHIF/SHIF, NSSF, PAYE)
      const nssf = calculateNssf(grossPay);
      const nhif = calculateShif(grossPay);
      const paye = calculatePaye(grossPay, nssf, nhif);

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

    // Generate PDFs and send emails asynchronously
    this.generateAndEmailPayslips(tenantId, runId).catch((err) => {
      this.logger.error(
        `Failed to generate/email payslips for run ${runId}`,
        err,
      );
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
    this.logger.log(`Initiating M-Pesa bulk disbursement for run ${runId}`);

    const payslips = await (this.prisma as any).payslip.findMany({
      where: { tenantId, payrollRunId: runId, paymentMethod: 'MPESA' },
      include: { employee: true },
    });

    const phoneNumbers = payslips
      .map((p: any) => p.employee.mpesaPhone)
      .filter(Boolean);
    const amounts = payslips.map((p: any) => p.netPay);

    if (phoneNumbers.length > 0) {
      await this.mpesaService.disburseB2C(phoneNumbers, amounts, runId);
    } else {
      this.logger.warn(`No M-Pesa recipients found for run ${runId}`);
    }

    return (this.prisma as any).payrollRun.update({
      where: { id: runId, tenantId },
      data: {
        status: 'DISBURSED',
        disbursedAt: new Date(),
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async generateAndEmailPayslips(tenantId: string, runId: string) {
    const payslips = await (this.prisma as any).payslip.findMany({
      where: { tenantId, payrollRunId: runId },
      include: { employee: true, payrollRun: true },
    });

    for (const payslip of payslips) {
      try {
        const emp = payslip.employee;
        const run = payslip.payrollRun;

        // SKELETON: Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `payslip_${emp.employeeNumber}_${run.period}.pdf`;
        const filePath = join('/tmp', fileName);

        doc.pipe(createWriteStream(filePath));
        doc.fontSize(20).text('PAYSLIP', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Employee: ${emp.firstName} ${emp.lastName}`);
        doc.text(`Employee No: ${emp.employeeNumber}`);
        doc.text(`Period: ${run.period}`).moveDown();

        doc.text(`Basic Salary: KES ${payslip.basicSalary.toLocaleString()}`);
        doc.text(`Overtime: KES ${payslip.overtime.toLocaleString()}`);
        doc
          .text(`Gross Pay: KES ${payslip.grossPay.toLocaleString()}`)
          .moveDown();

        doc.text(`PAYE: KES ${payslip.paye.toLocaleString()}`);
        doc.text(`NSSF: KES ${payslip.nssf.toLocaleString()}`);
        doc.text(`SHIF/NHIF: KES ${payslip.nhif.toLocaleString()}`);
        doc
          .text(
            `Total Deductions: KES ${payslip.totalDeductions.toLocaleString()}`,
          )
          .moveDown();

        doc
          .fontSize(14)
          .text(`Net Pay: KES ${payslip.netPay.toLocaleString()}`, {
            underline: true,
          });
        doc.end();

        // Update payslip record with file path (or S3 URL in production)
        await (this.prisma as any).payslip.update({
          where: { id: payslip.id },
          data: { pdfUrl: filePath },
        });

        // SKELETON: Send email
        if (emp.email) {
          await resend.emails.send({
            from: 'hr@flori.os',
            to: emp.email,
            subject: `Your Payslip for ${run.period}`,
            text: `Hello ${emp.firstName},\n\nPlease find attached your payslip for the period ${run.period}.\n\nBest regards,\nHR Department`,
            attachments: [
              {
                filename: fileName,
                path: filePath,
              },
            ],
          });
          this.logger.log(`Emailed payslip to ${emp.email}`);
        }
      } catch (err) {
        this.logger.error(
          `Failed generating/emailing payslip for ${payslip.employeeId}:`,
          err,
        );
      }
    }
  }
}
