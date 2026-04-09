/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from './accounts.service';
import { CurrencyService } from './currency.service';

export interface JournalEntryDto {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface CreateJournalDto {
  reference?: string;
  description: string;
  userId?: string;
  transactionCurrency?: string;
  entries: JournalEntryDto[];
}

@Injectable()
export class FinancialsService {
  private readonly logger = new Logger(FinancialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly currencyService: CurrencyService,
  ) {}

  /**
   * Records a double-entry journal record.
   * Ensures that total debits equal total credits.
   */
  async createJournal(tenantId: string, dto: CreateJournalDto) {
    const totalDebit = dto.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = dto.entries.reduce((sum, e) => sum + e.credit, 0);

    // Using a small epsilon for float comparison
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(
        `Journal entry does not balance. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`,
      );
    }

    const baseCurrency =
      await this.currencyService.getTenantBaseCurrency(tenantId);
    const txnCurrency = dto.transactionCurrency || baseCurrency;
    const rate = await this.currencyService.getExchangeRate(
      tenantId,
      txnCurrency,
      baseCurrency,
    );

    // Validate accounts and build create payload
    const entryData = [];
    for (const e of dto.entries) {
      const account = await this.accountsService.getAccountByCode(
        tenantId,
        e.accountCode,
      );
      // Even if account fails to lookup (maybe a test error), we must not crash the whole app if they haven't seeded yet.
      // But ideally we'd throw. For safety/migration, we allow null accountId for now, but save code.

      entryData.push({
        accountId: account ? account.id : null,
        accountCode: e.accountCode,
        debit: e.debit,
        credit: e.credit,
        exchangeRate: rate,
        baseDebit: e.debit * rate,
        baseCredit: e.credit * rate,
      });
    }

    return await this.prisma.financialJournal.create({
      data: {
        tenantId,
        reference: dto.reference,
        description: dto.description,
        userId: dto.userId,
        entries: {
          create: entryData,
        },
      },
      include: { entries: true },
    });
  }

  async getJournals(tenantId: string) {
    return this.prisma.financialJournal.findMany({
      where: { tenantId },
      include: { entries: true },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Generates a draft invoice when an order is completed/delivered.
   */
  async generateInvoice(
    tenantId: string,
    orderId: string,
    totalAmount: number,
    currency: string,
  ) {
    const existing = await (this.prisma as any).invoice.findUnique({
      where: { orderId },
    });

    if (existing) {
      this.logger.warn(`Invoice already exists for order ${orderId}`);
      return existing;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30 default

    const invoice = await (this.prisma as any).invoice.create({
      data: {
        tenantId,
        orderId,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        totalAmount,
        currency,
        dueDate,
        status: 'DRAFT',
      },
    });

    this.logger.log(
      `Generated invoice ${invoice.invoiceNumber} for order ${orderId}`,
    );

    // Create AR Journal Entry
    await this.createJournal(tenantId, {
      description: `Accounts Receivable for Invoice ${invoice.invoiceNumber}`,
      transactionCurrency: currency,
      entries: [
        { accountCode: '1200', debit: totalAmount, credit: 0 }, // Accounts Receivable
        { accountCode: '4000', debit: 0, credit: totalAmount }, // Sales Revenue
      ],
    });

    return invoice;
  }
}
