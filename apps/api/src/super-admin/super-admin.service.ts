/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private getModel(modelName: string) {
    const prismaModel = (this.prisma as any)[modelName.toLowerCase()];
    if (!prismaModel) {
      throw new BadRequestException(`Model "${modelName}" not found in system.`);
    }
    return prismaModel;
  }

  async findAll(model: string, query: any = {}) {
    const { skip, take, cursor, where, orderBy, include } = query;
    return this.getModel(model).findMany({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      cursor,
      where: where ? JSON.parse(where) : undefined,
      orderBy: orderBy ? JSON.parse(orderBy) : undefined,
      include: include ? JSON.parse(include) : undefined,
    });
  }

  async findOne(model: string, id: string, query: any = {}) {
    const { include } = query;
    const record = await this.getModel(model).findUnique({
      where: { id },
      include: include ? JSON.parse(include) : undefined,
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found in ${model}`);
    return record;
  }

  async create(model: string, data: any) {
    return this.getModel(model).create({
      data,
    });
  }

  async update(model: string, id: string, data: any) {
    return this.getModel(model).update({
      where: { id },
      data,
    });
  }

  async remove(model: string, id: string) {
    return this.getModel(model).delete({
      where: { id },
    });
  }
}
