/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class LogisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(tenantId: string) {
    return await this.prisma.order.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: { name: true, country: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(
    tenantId: string,
    data: {
      type: 'EXPORT' | 'LOCAL';
      customerId: string;
      items: any;
      totalAmount: number;
      currency?: string;
      shipmentDate?: string;
    },
  ) {
    // Check if customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });
    if (!customer) throw new BadRequestException('Invalid customer reference');

    // ATP Check for Finished Goods (Packed Boxes)
    const atp = await this.inventoryService.getFinishedGoodsATP(tenantId);
    const itemArray = Array.isArray(data.items) ? data.items : [data.items];

    for (const item of itemArray) {
      if (
        item.varietyId &&
        item.grade &&
        item.bunchSize &&
        item.bunchesPerBox
      ) {
        const matchingATP = atp.find(
          (a) =>
            a.varietyId === item.varietyId &&
            a.grade === item.grade &&
            a.bunchSize === item.bunchSize &&
            a.bunchesPerBox === item.bunchesPerBox,
        );

        if (!matchingATP || matchingATP.atp < item.quantity) {
          throw new BadRequestException(
            `Insufficient ATP for ${matchingATP?.varietyName || 'selected variety'}. Available: ${matchingATP?.atp || 0}, Requested: ${item.quantity}`,
          );
        }
      }
    }

    return await this.prisma.order.create({
      data: {
        ...data,
        tenantId,
        status: 'PENDING',
        shipmentDate: data.shipmentDate ? new Date(data.shipmentDate) : null,
      },
    });
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: 'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  ) {
    const order = await this.findOne(tenantId, id);
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
    });

    // Stock Automation: Reduce inventory when marked as DELIVERED
    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
      const items = (order.items as any) || [];
      const productItems = Array.isArray(items) ? items : [items];

      for (const item of productItems) {
        if (item.sku && item.quantity) {
          const product = await this.prisma.product.findFirst({
            where: { sku: item.sku, tenantId },
          });
          if (product) {
            await this.prisma.product.update({
              where: { id: product.id },
              data: { stock: { decrement: Number(item.quantity) } },
            });
          }
        }
      }
    }

    return updatedOrder;
  }

  // Customer sub-management
  async findAllCustomers(tenantId: string) {
    return await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCustomer(
    tenantId: string,
    data: { name: string; email?: string; country?: string; address?: string },
  ) {
    return await this.prisma.customer.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }
}
