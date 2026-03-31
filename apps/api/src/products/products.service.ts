/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return await this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(tenantId: string, data: any) {
    return await this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    return await this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return await this.prisma.product.delete({
      where: { id },
    });
  }

  // Stock Automation helper
  async reduceStock(tenantId: string, sku: string, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: { sku, tenantId },
    });

    if (product) {
      return await this.prisma.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: quantity },
        },
      });
    }
  }
}
