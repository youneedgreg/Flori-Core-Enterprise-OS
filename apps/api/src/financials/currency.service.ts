/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  // MOCK Exchange rate feed
  // In a real app we would call Fixer.io or OpenExchangeRates
  private readonly mockRates = {
    USD: 1,
    KES: 130.5,
    EUR: 0.92,
    GBP: 0.79,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getTenantBaseCurrency(tenantId: string): Promise<string> {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { baseCurrency: true },
    });
    return tenant?.baseCurrency || 'USD';
  }

  async updateTenantBaseCurrency(tenantId: string, currency: string) {
    const updated = await (this.prisma as any).tenant.update({
      where: { id: tenantId },
      data: { baseCurrency: currency.toUpperCase() },
    });
    this.logger.log(
      `Tenant ${tenantId} base currency globally set to ${currency.toUpperCase()}`,
    );
    return updated;
  }

  async getExchangeRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) return 1.0;

    // 1. Check if we have an active override in the DB
    const customRate = await (this.prisma as any).exchangeRate.findFirst({
      where: {
        tenantId,
        fromCurrency,
        toCurrency,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (customRate) {
      return customRate.rate;
    }

    // 2. Mock external fetching
    const fromUSD = this.mockRates[fromCurrency as keyof typeof this.mockRates];
    const toUSD = this.mockRates[toCurrency as keyof typeof this.mockRates];

    if (!fromUSD || !toUSD) {
      this.logger.warn(
        `No exchange rate known for ${fromCurrency} to ${toCurrency}. Defaulting to 1.0`,
      );
      return 1.0;
    }

    // Convert routing through USD
    const rate = toUSD / fromUSD;

    // Optional: Log it in our table for caching
    try {
      await (this.prisma as any).exchangeRate.create({
        data: {
          tenantId,
          fromCurrency,
          toCurrency,
          rate,
        },
      });
    } catch (e) {
      // Ignore conflict / cache error
    }

    return rate;
  }
}
