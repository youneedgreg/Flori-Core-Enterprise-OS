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
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private getModel(modelName: string) {
    const key = modelName.toLowerCase();
    const prismaModel = (this.prisma as any)[key];
    if (!prismaModel) {
      throw new BadRequestException(`Model "${modelName}" not found in system.`);
    }
    return prismaModel;
  }

  async getModelsList() {
    // Standard Prisma client internal properties to exclude
    const internalKeys = [
      '$connect',
      '$disconnect',
      '$on',
      '$transaction',
      '$use',
      '$executeRaw',
      '$executeRawUnsafe',
      '$queryRaw',
      '$queryRawUnsafe',
      'constructor',
    ];

    return Object.keys(this.prisma).filter(
      (key) => !key.startsWith('_') && !internalKeys.includes(key),
    );
  }

  private parsePrismaQuery(query: any) {
    const { skip, take, page, limit, sort, include, ...filters } = query;

    const prismaQuery: any = {
      where: {},
      include: include ? JSON.parse(include) : undefined,
    };

    // Pagination
    if (limit || take) {
      prismaQuery.take = Number(limit || take);
    }
    if (page && prismaQuery.take) {
      prismaQuery.skip = (Number(page) - 1) * prismaQuery.take;
    } else if (skip) {
      prismaQuery.skip = Number(skip);
    }

    // Sorting: field:asc or field:desc
    if (sort) {
      const [field, direction] = sort.split(':');
      prismaQuery.orderBy = { [field]: direction || 'asc' };
    }

    // Advanced Filtering: field_operator=value
    // operators: contains, equals, gt, gte, lt, lte, in, startsWith, endsWith
    Object.keys(filters).forEach((key) => {
      const parts = key.split('_');
      if (parts.length > 1) {
        const field = parts[0];
        const operator = parts[1];
        let value = filters[key];

        // Type conversion for common patterns
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        if (!isNaN(value) && value.trim() !== '') value = Number(value);
        if (operator === 'in') value = value.split(',');

        prismaQuery.where[field] = { [operator]: value };
      } else {
        // Default to equals
        let value = filters[key];
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        prismaQuery.where[key] = value;
      }
    });

    return prismaQuery;
  }

  private async preProcessData(model: string, data: any) {
    const processed = { ...data };
    const modelName = model.toLowerCase();

    // User: Hash password if provided
    if (modelName === 'user' && processed.password) {
      processed.passwordHash = await bcrypt.hash(processed.password, 10);
      delete processed.password;
    }

    // Tenant: Generate slug if missing
    if (modelName === 'tenant' && processed.name && !processed.slug) {
      processed.slug = processed.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    return processed;
  }

  async findAll(model: string, query: any = {}) {
    const prismaQuery = this.parsePrismaQuery(query);
    const modelDelegate = this.getModel(model);

    const [data, total] = await Promise.all([
      modelDelegate.findMany(prismaQuery),
      modelDelegate.count({ where: prismaQuery.where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page ? Number(query.page) : 1,
        limit: prismaQuery.take || total,
      },
    };
  }

  async findOne(model: string, id: string, query: any = {}) {
    const { include } = query;
    const record = await this.getModel(model).findUnique({
      where: { id },
      include: include ? JSON.parse(include) : undefined,
    });
    if (!record) {
      throw new NotFoundException(`Record with ID ${id} not found in ${model}`);
    }
    return record;
  }

  async create(model: string, data: any) {
    const processedData = await this.preProcessData(model, data);
    return this.getModel(model).create({
      data: processedData,
    });
  }

  async update(model: string, id: string, data: any) {
    const processedData = await this.preProcessData(model, data);
    return this.getModel(model).update({
      where: { id },
      data: processedData,
    });
  }

  async remove(model: string, id: string) {
    return this.getModel(model).delete({
      where: { id },
    });
  }
}
