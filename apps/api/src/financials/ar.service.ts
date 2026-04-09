/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

@Injectable()
export class ARService {
  private readonly logger = new Logger(ARService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Invoice Queries ──────────────────────────────────────────────────────────

  async getInvoices(tenantId: string, status?: string) {
    return (this.prisma as any).invoice.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, creditLimit: true },
            },
          },
        },
        payments: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getInvoice(tenantId: string, id: string) {
    const invoice = await (this.prisma as any).invoice.findFirst({
      where: { id, tenantId },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  // ── Status Transitions ───────────────────────────────────────────────────────

  async markSent(tenantId: string, id: string) {
    const invoice = await this.getInvoice(tenantId, id);
    if (!['DRAFT'].includes(invoice.status)) {
      throw new BadRequestException(
        `Cannot mark invoice ${invoice.status} as Sent`,
      );
    }
    return (this.prisma as any).invoice.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }

  // ── Payment Recording ────────────────────────────────────────────────────────

  async recordPayment(
    tenantId: string,
    invoiceId: string,
    data: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
      paidAt?: string;
    },
  ) {
    const invoice = await this.getInvoice(tenantId, invoiceId);

    if (['PAID', 'CANCELLED'].includes(invoice.status)) {
      throw new BadRequestException(`Invoice is already ${invoice.status}`);
    }

    const newPaid = invoice.paidAmount + data.amount;

    if (newPaid > invoice.totalAmount) {
      throw new BadRequestException(
        `Payment of ${data.amount} exceeds outstanding balance of ${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}`,
      );
    }

    // Determine new status
    const newStatus: InvoiceStatus =
      newPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    // Create payment record + update invoice atomically
    const [payment] = await (this.prisma as any).$transaction([
      (this.prisma as any).invoicePayment.create({
        data: {
          tenantId,
          invoiceId,
          amount: data.amount,
          method: data.method ?? 'BANK_TRANSFER',
          reference: data.reference,
          notes: data.notes,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        },
      }),
      (this.prisma as any).invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaid, status: newStatus },
      }),
    ]);

    this.logger.log(
      `Payment of ${data.amount} recorded for invoice ${invoice.invoiceNumber} — new status: ${newStatus}`,
    );

    return payment;
  }

  // ── Credit Limit Check ───────────────────────────────────────────────────────

  async checkCreditLimit(
    tenantId: string,
    customerId: string,
    newOrderAmount: number,
  ) {
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    if (!customer.creditLimit) {
      return { allowed: true, message: 'No credit limit set' };
    }

    // Sum all open unpaid invoices for this customer
    const openInvoices = await (this.prisma as any).invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        order: { customerId },
      },
      select: { totalAmount: true, paidAmount: true },
    });

    const totalOutstanding = openInvoices.reduce(
      (sum: number, inv: any) => sum + (inv.totalAmount - inv.paidAmount),
      0,
    );

    const projectedExposure = totalOutstanding + newOrderAmount;
    const allowed = projectedExposure <= customer.creditLimit;

    return {
      allowed,
      creditLimit: customer.creditLimit,
      currentOutstanding: totalOutstanding,
      projectedExposure,
      message: allowed
        ? `Within credit limit (${projectedExposure.toFixed(2)} / ${customer.creditLimit})`
        : `Exceeds credit limit! Outstanding ${totalOutstanding.toFixed(2)} + new order ${newOrderAmount} = ${projectedExposure.toFixed(2)} > limit ${customer.creditLimit}`,
    };
  }

  // ── Aging Report ─────────────────────────────────────────────────────────────

  async getAgingReport(tenantId: string) {
    const invoices = await (this.prisma as any).invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: {
        order: {
          include: { customer: { select: { id: true, name: true } } },
        },
      },
    });

    const now = new Date();

    const buckets = {
      current: [] as any[], // 0–30 days
      days31to60: [] as any[], // 31–60 days
      days61to90: [] as any[], // 61–90 days
      over90: [] as any[], // 90+ days
    };

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue;

      const daysOverdue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const summary = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.order?.customer?.name ?? 'Unknown',
        customerId: invoice.order?.customer?.id,
        daysOverdue,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        outstanding: invoice.totalAmount - invoice.paidAmount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
      };

      if (daysOverdue <= 30) buckets.current.push(summary);
      else if (daysOverdue <= 60) buckets.days31to60.push(summary);
      else if (daysOverdue <= 90) buckets.days61to90.push(summary);
      else buckets.over90.push(summary);
    }

    const totalOutstanding = (arr: any[]) =>
      arr.reduce((sum, inv) => sum + inv.outstanding, 0);

    return {
      buckets,
      totals: {
        current: totalOutstanding(buckets.current),
        days31to60: totalOutstanding(buckets.days31to60),
        days61to90: totalOutstanding(buckets.days61to90),
        over90: totalOutstanding(buckets.over90),
        grand: totalOutstanding([
          ...buckets.current,
          ...buckets.days31to60,
          ...buckets.days61to90,
          ...buckets.over90,
        ]),
      },
    };
  }

  // ── Reminders (can be called by a cron job) ──────────────────────────────────

  async processReminders(tenantId: string) {
    const now = new Date();

    // Find all SENT or PARTIALLY_PAID invoices that are past due
    const overdueInvoices = await (this.prisma as any).invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      include: {
        order: {
          include: { customer: { select: { name: true, email: true } } },
        },
      },
    });

    const updates: Array<{
      id: string;
      remindersSent: number;
      lastReminderAt: Date;
      status: string;
    }> = [];

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Reminder schedule: Day 0, 7, 14, 30 of being overdue
      const reminderDays = [0, 7, 14, 30];
      const lastSent = invoice.lastReminderAt
        ? Math.floor(
            (now.getTime() - new Date(invoice.lastReminderAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      const shouldSend =
        reminderDays.some((d) => daysOverdue >= d) &&
        (lastSent === null || lastSent >= 7);

      if (shouldSend) {
        const escalationLevel =
          invoice.remindersSent >= 3
            ? 'FINAL_NOTICE'
            : `REMINDER_${invoice.remindersSent + 1}`;
        this.logger.log(
          `[AR] Sending ${escalationLevel} to ${invoice.order?.customer?.email ?? 'unknown'} for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
        );

        // In production: call EmailService / NotificationService here
        // this.notificationService.sendInvoiceReminder(invoice, escalationLevel);

        updates.push({
          id: invoice.id,
          remindersSent: invoice.remindersSent + 1,
          lastReminderAt: now,
          status: 'OVERDUE',
        });
      }
    }

    // Batch update all
    for (const u of updates) {
      await (this.prisma as any).invoice.update({
        where: { id: u.id },
        data: {
          remindersSent: u.remindersSent,
          lastReminderAt: u.lastReminderAt,
          status: u.status,
        },
      });
    }

    return {
      processed: overdueInvoices.length,
      remindersQueued: updates.length,
    };
  }
}
