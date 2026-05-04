import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuctionLotStatus, OrderType, OrderStatus, QCGrade, CustomerType, CustomerSegment } from '@prisma/client';

export interface CreateAuctionLotDto {
  clockNumber: string;
  varietyId: string;
  grade: QCGrade;
  bunchSize: number;
  totalBunches: number;
  expectedPrice?: number;
}

export interface AuctionResultDto {
  clockNumber: string;
  actualPricePerStem: number;
}

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAuctionLots(tenantId: string) {
    return this.prisma.auctionLot.findMany({
      where: { tenantId },
      include: {
        variety: { select: { name: true } },
        order: { select: { orderNumber: true, invoice: { select: { invoiceNumber: true, totalAmount: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAuctionLot(tenantId: string, dto: CreateAuctionLotDto) {
    const variety = await this.prisma.variety.findFirst({
      where: { id: dto.varietyId, tenantId }
    });
    if (!variety) throw new NotFoundException('Variety not found');

    return this.prisma.auctionLot.create({
      data: {
        tenantId,
        clockNumber: dto.clockNumber,
        varietyId: dto.varietyId,
        grade: dto.grade,
        bunchSize: dto.bunchSize,
        totalBunches: dto.totalBunches,
        totalStems: dto.bunchSize * dto.totalBunches,
        expectedPrice: dto.expectedPrice,
        status: AuctionLotStatus.PREPARED
      }
    });
  }

  async importAuctionResults(tenantId: string, results: AuctionResultDto[]) {
    const lotsToUpdate: {
      id: string;
      clockNumber: string;
      actualPrice: number;
      totalValue: number;
      varietyName: string;
      grade: QCGrade;
      bunchSize: number;
      totalBunches: number;
      totalStems: number;
    }[] = [];
    let totalOrderAmount = 0;

    for (const result of results) {
      const lot = await this.prisma.auctionLot.findFirst({
        where: { tenantId, clockNumber: result.clockNumber, status: AuctionLotStatus.PREPARED },
        include: { variety: true }
      });

      if (!lot) {
        this.logger.warn(`Lot with clock number ${result.clockNumber} not found or not in PREPARED state.`);
        continue;
      }

      const totalValue = result.actualPricePerStem * lot.totalStems;
      totalOrderAmount += totalValue;

      lotsToUpdate.push({
        id: lot.id,
        clockNumber: lot.clockNumber,
        actualPrice: result.actualPricePerStem,
        totalValue,
        varietyName: lot.variety.name,
        grade: lot.grade,
        bunchSize: lot.bunchSize,
        totalBunches: lot.totalBunches,
        totalStems: lot.totalStems
      });
    }

    if (lotsToUpdate.length === 0) {
      throw new BadRequestException('No valid PREPARED lots found to import.');
    }

    let auctionCustomer = await this.prisma.customer.findFirst({
      where: { tenantId, type: CustomerType.AUCTION_HOUSE }
    });

    if (!auctionCustomer) {
      auctionCustomer = await this.prisma.customer.create({
        data: {
          tenantId,
          name: 'Dutch Flower Auction',
          type: CustomerType.AUCTION_HOUSE,
          segment: CustomerSegment.EXPORT
        }
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count({
        where: { tenantId, isTemplate: false, orderNumber: { not: null } },
      });
      const year = new Date().getFullYear();
      const orderNumber = `ORD-${year}-${String(count + 1).padStart(5, '0')}`;

      const items = lotsToUpdate.map(lot => ({
        varietyId: lot.id,
        varietyName: lot.varietyName,
        grade: lot.grade,
        bunchSize: lot.bunchSize,
        bunchesPerBox: lot.totalBunches,
        quantity: lot.totalStems,
        pricePerStem: lot.actualPrice,
        totalValue: lot.totalValue,
        clockNumber: lot.clockNumber
      }));

      const order = await tx.order.create({
        data: {
          tenantId,
          customerId: auctionCustomer.id,
          type: OrderType.AUCTION_ORDER,
          status: OrderStatus.INVOICED,
          orderNumber,
          totalAmount: totalOrderAmount,
          items: items as any,
          notes: 'Auto-generated from Auction Results'
        }
      });

      for (const lot of lotsToUpdate) {
        await tx.auctionLot.update({
          where: { id: lot.id },
          data: {
            actualPrice: lot.actualPrice,
            status: AuctionLotStatus.AUCTIONED,
            auctionDate: new Date(),
            orderId: order.id
          }
        });
      }

      const invoiceNumber = `INV-AUC-${Date.now().toString().slice(-6)}`;
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          orderId: order.id,
          invoiceNumber,
          totalAmount: totalOrderAmount,
          status: 'SENT'
        }
      });

      return {
        order,
        invoice,
        lotsImported: lotsToUpdate.length
      };
    });
  }
}
