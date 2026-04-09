/* eslint-disable prettier/prettier */
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
import { FinancialsService } from './financials.service';

@Injectable()
export class APService {
  private readonly logger = new Logger(APService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financials: FinancialsService,
  ) {}

  // ── Vendor Invoice CRUD ──────────────────────────────────────────────────────

  getVendorInvoices(tenantId: string, status?: string) {
    return (this.prisma as any).vendorInvoice.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        po: { select: { id: true, poNumber: true, totalAmount: true } },
        grn: { select: { id: true, grnNumber: true, receivedDate: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVendorInvoice(tenantId: string, id: string) {
    const inv = await (this.prisma as any).vendorInvoice.findFirst({
      where: { id, tenantId },
      include: {
        vendor: true,
        po: { include: { items: { include: { item: true } } } },
        grn: { include: { items: { include: { item: true } } } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!inv) throw new NotFoundException('Vendor invoice not found');
    return inv;
  }

  async createVendorInvoice(
    tenantId: string,
    data: {
      vendorId: string;
      poId?: string;
      grnId?: string;
      invoiceNumber: string;
      totalAmount: number;
      currency?: string;
      invoiceDate: string;
      dueDate?: string;
      notes?: string;
      taxRateId?: string;
    },
  ) {
    // 3-way match validation — if PO and GRN are provided, verify they link
    if (data.poId && data.grnId) {
      const grn = await (this.prisma as any).goodsReceivedNote.findFirst({
        where: { id: data.grnId, poId: data.poId, tenantId },
      });
      if (!grn) {
        throw new BadRequestException(
          '3-Way Match failed: GRN does not belong to the specified Purchase Order',
        );
      }
    }

    let vatAmount = 0;
    if (data.taxRateId) {
      const taxRate = await (this.prisma as any).taxRate.findUnique({
        where: { id: data.taxRateId, tenantId },
      });
      if (taxRate) {
        // Calculate VAT (assuming totalAmount includes VAT)
        const baseAmount = data.totalAmount / (1 + taxRate.rate / 100);
        vatAmount = data.totalAmount - baseAmount;
      }
    }

    const invoice = await (this.prisma as any).vendorInvoice.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        poId: data.poId ?? null,
        grnId: data.grnId ?? null,
        invoiceNumber: data.invoiceNumber,
        totalAmount: data.totalAmount,
        vatAmount,
        taxRateId: data.taxRateId,
        currency: data.currency ?? 'USD',
        invoiceDate: new Date(data.invoiceDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
      },
    });

    // Post initial liability: debit Expense (Inventory/COGS), credit AP
    const expenseAmount = data.totalAmount - vatAmount;
    const entries = [
      { accountCode: '5000', debit: expenseAmount, credit: 0 }, // COGS / Expense
      { accountCode: '2000', debit: 0, credit: data.totalAmount }, // Accounts Payable
    ];

    if (vatAmount > 0) {
      entries.push({ accountCode: '2100', debit: vatAmount, credit: 0 }); // Input VAT (Asset/Receivable from Tax office)
      // Note: For AP, VAT is usually a debit to a tax asset account (Input VAT), reducing net tax payable.
    }

    try {
      await this.financials.createJournal(tenantId, {
        reference: invoice.invoiceNumber,
        description: `Purchase Liability: ${invoice.invoiceNumber}`,
        transactionCurrency: invoice.currency,
        entries,
      });
    } catch (e) {
      this.logger.error(`Failed to post AP liability journal for ${invoice.invoiceNumber}`, e);
    }

    this.logger.log(
      `Created vendor invoice ${data.invoiceNumber} (${data.totalAmount}) for vendor ${data.vendorId}`,
    );
    return invoice;
  }

  // ── Approval Workflow ────────────────────────────────────────────────────────

  async approveVendorInvoice(tenantId: string, id: string, approverId: string) {
    const inv = await this.getVendorInvoice(tenantId, id);
    if (inv.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot approve invoice with status ${inv.status}`,
      );
    }
    return (this.prisma as any).vendorInvoice.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async rejectVendorInvoice(
    tenantId: string,
    id: string,
    rejectorId: string,
    reason: string,
  ) {
    const inv = await this.getVendorInvoice(tenantId, id);
    if (inv.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot reject invoice with status ${inv.status}`,
      );
    }
    return (this.prisma as any).vendorInvoice.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: rejectorId,
        rejectionReason: reason,
      },
    });
  }

  async schedulePayment(tenantId: string, id: string, scheduledPayAt: string) {
    const inv = await this.getVendorInvoice(tenantId, id);
    if (!['APPROVED'].includes(inv.status)) {
      throw new BadRequestException(
        `Can only schedule APPROVED invoices, current status: ${inv.status}`,
      );
    }
    return (this.prisma as any).vendorInvoice.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledPayAt: new Date(scheduledPayAt) },
    });
  }

  // ── Payment Recording ────────────────────────────────────────────────────────

  async recordVendorPayment(
    tenantId: string,
    vendorInvoiceId: string,
    data: {
      amount: number;
      method?: string;
      reference?: string;
      notes?: string;
      paidAt?: string;
    },
  ) {
    const inv = await this.getVendorInvoice(tenantId, vendorInvoiceId);
    if (['PAID', 'REJECTED'].includes(inv.status)) {
      throw new BadRequestException(`Invoice is already ${inv.status}`);
    }

    const newPaid = inv.paidAmount + data.amount;
    const newStatus = newPaid >= inv.totalAmount ? 'PAID' : 'SCHEDULED';

    const [payment] = await (this.prisma as any).$transaction([
      (this.prisma as any).vendorPayment.create({
        data: {
          vendorInvoiceId,
          amount: data.amount,
          currency: inv.currency,
          method: data.method ?? 'BANK_TRANSFER',
          reference: data.reference,
          notes: data.notes,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        },
      }),
      (this.prisma as any).vendorInvoice.update({
        where: { id: vendorInvoiceId },
        data: { paidAmount: newPaid, status: newStatus },
      }),
    ]);

    // Post AP journal entry: debit AP Liability, credit Cash
    try {
      await this.financials.createJournal(tenantId, {
        reference: inv.invoiceNumber,
        description: `Vendor Payment: ${inv.invoiceNumber}`,
        transactionCurrency: inv.currency,
        entries: [
          { accountCode: '2000', debit: data.amount, credit: 0 }, // AP Liability cleared
          { accountCode: '1000', debit: 0, credit: data.amount }, // Cash / Bank reduced
        ],
      });
    } catch (e) {
      this.logger.error(
        `Failed to post AP journal for invoice ${inv.invoiceNumber}`,
        e,
      );
    }

    this.logger.log(
      `Payment of ${data.amount} recorded for vendor invoice ${inv.invoiceNumber}`,
    );
    return payment;
  }

  // ── Bank Payment Export ──────────────────────────────────────────────────────

  /**
   * Generate a simplified SWIFT MT101 / CSV bank export for a batch of scheduled payments.
   * In production this would be sent directly to the bank's payment gateway.
   */
  async exportPaymentFile(
    tenantId: string,
    vendorInvoiceIds: string[],
    format: 'MT101' | 'CSV' = 'CSV',
  ) {
    const invoices = await (this.prisma as any).vendorInvoice.findMany({
      where: {
        id: { in: vendorInvoiceIds },
        tenantId,
        status: { in: ['APPROVED', 'SCHEDULED'] },
      },
      include: {
        vendor: true,
      },
    });

    if (invoices.length === 0) {
      throw new BadRequestException(
        'No approved/scheduled invoices found for export',
      );
    }

    let output = '';
    const exportedAt = new Date();

    if (format === 'CSV') {
      output =
        'Vendor Name,Account No,Bank,Swift,Amount,Currency,Invoice Ref,Due Date\n';
      for (const inv of invoices) {
        const bank = inv.vendor.bankDetails ?? {};
        output +=
          [
            inv.vendor.name,
            bank.accountNo ?? '',
            bank.bankName ?? '',
            bank.swiftCode ?? '',
            (inv.totalAmount - inv.paidAmount).toFixed(2),
            inv.currency,
            inv.invoiceNumber,
            inv.dueDate
              ? new Date(inv.dueDate).toISOString().split('T')[0]
              : '',
          ].join(',') + '\n';
      }
    } else {
      // Simplified SWIFT MT101 block structure
      output = `:20:PAYRUN-${Date.now()}\n:28D:1/1\n`;
      for (const inv of invoices) {
        const bank = inv.vendor.bankDetails ?? {};
        const outstanding = (inv.totalAmount - inv.paidAmount).toFixed(2);
        output += `:21:${inv.invoiceNumber}\n`;
        output += `:32B:${inv.currency}${outstanding}\n`;
        output += `:59:/${bank.accountNo ?? 'N/A'}\n${inv.vendor.name}\n`;
        output += `:70:${inv.invoiceNumber}\n`;
        output += `:71A:SHA\n-\n`;
      }
    }

    // Mark all exported invoices
    await (this.prisma as any).vendorPayment.updateMany({
      where: { vendorInvoiceId: { in: vendorInvoiceIds } },
      data: { exportedAt },
    });

    return {
      format,
      invoiceCount: invoices.length,
      totalAmount: invoices.reduce(
        (s: number, i: any) => s + i.totalAmount - i.paidAmount,
        0,
      ),
      generatedAt: exportedAt,
      content: output,
    };
  }

  // ── 3-Way Match Verification ─────────────────────────────────────────────────

  async verifyThreeWayMatch(tenantId: string, vendorInvoiceId: string) {
    const inv = await this.getVendorInvoice(tenantId, vendorInvoiceId);

    if (!inv.poId || !inv.grnId) {
      return {
        matched: false,
        reason: 'Missing PO or GRN link — cannot perform 3-way match',
      };
    }

    const po = inv.po;
    const grn = inv.grn;

    // Check 1: PO amount vs Invoice amount (within 5% tolerance)
    const amountDiff =
      Math.abs(po.totalAmount - inv.totalAmount) / po.totalAmount;
    if (amountDiff > 0.05) {
      return {
        matched: false,
        reason: `Amount mismatch: PO total ${po.totalAmount} vs Invoice ${inv.totalAmount} (${(amountDiff * 100).toFixed(1)}% variance)`,
        po: { totalAmount: po.totalAmount },
        invoice: { totalAmount: inv.totalAmount },
      };
    }

    // Check 2: GRN goods were actually received
    if (grn.status === 'DISCREPANCY') {
      return {
        matched: false,
        reason: `GRN ${grn.grnNumber} has discrepancy — resolve before approving payment`,
      };
    }

    return {
      matched: true,
      message:
        '3-Way Match passed: PO → GRN → Invoice amounts reconcile within tolerance',
      po: { poNumber: po.poNumber, totalAmount: po.totalAmount },
      grn: { grnNumber: grn.grnNumber, status: grn.status },
      invoice: {
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
      },
    };
  }
}
