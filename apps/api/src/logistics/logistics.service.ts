import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return await (this.prisma as any).order.findMany({
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
    const order = await (this.prisma as any).order.findFirst({
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
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: data.customerId, tenantId },
    });
    if (!customer) throw new BadRequestException('Invalid customer reference');

    return await (this.prisma as any).order.create({
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
    await this.findOne(tenantId, id);
    return await (this.prisma as any).order.update({
      where: { id },
      data: { status },
    });
  }

  // Customer sub-management
  async findAllCustomers(tenantId: string) {
    return await (this.prisma as any).customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCustomer(
    tenantId: string,
    data: { name: string; email?: string; country?: string; address?: string },
  ) {
    return await (this.prisma as any).customer.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }
}
