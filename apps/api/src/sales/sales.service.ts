/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  LeadStatus,
  CustomerType,
  CustomerSegment,
  OrderType,
  OrderStatus,
  TemplateFrequency,
} from '@prisma/client';

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  country?: string;
  type: CustomerType;
  segment: CustomerSegment;
  notes?: string;
  commissionRate?: number;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface CreateLeadDto {
  name: string;
  email?: string;
  phone?: string;
  value?: number;
  notes?: string;
  assignedToId?: string;
}

export interface CreateContactLogDto {
  customerId: string;
  type: string; // EMAIL, CALL, MEETING, NOTE
  subject?: string;
  notes: string;
  date?: string;
}

export interface OrderItemDto {
  varietyId: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  quantity: number;
}

export interface CreateOrderDto {
  customerId: string;
  type: OrderType;
  items: OrderItemDto[];
  totalAmount: number;
  currency?: string;
  deliveryDate?: string;
  notes?: string;
  isTemplate?: boolean;
  templateFrequency?: TemplateFrequency;
}

export interface GetOrdersFilterDto {
  status?: OrderStatus;
  type?: OrderType;
  isTemplate?: boolean;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ── Customers ──────────────────────────────────────────────────────────────

  async getCustomers(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        _count: { select: { orders: true, contactLogs: true, leads: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        contactLogs: {
          include: { user: { select: { email: true } } },
          orderBy: { date: 'desc' },
        },
        leads: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(tenantId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { tenantId, ...dto },
    });
  }

  async updateCustomer(
    tenantId: string,
    id: string,
    dto: Partial<CreateCustomerDto>,
  ) {
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  // ── Leads ──────────────────────────────────────────────────────────────────

  getLeads(tenantId: string) {
    return this.prisma.lead.findMany({
      where: { tenantId },
      include: {
        assignedTo: { select: { email: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createLead(tenantId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: { tenantId, ...dto },
    });
  }

  async updateLeadStatus(tenantId: string, id: string, status: LeadStatus) {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id },
        data: { status },
      });

      // Automatically convert to Customer if status becomes ACTIVE
      if (status === LeadStatus.ACTIVE && !lead.customerId) {
        const customer = await tx.customer.create({
          data: {
            tenantId,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            type: CustomerType.DIRECT_BUYER, // Default
            segment: CustomerSegment.LOCAL_RETAIL, // Default
            notes: `Converted from Lead: ${lead.notes || ''}`,
          },
        });

        await tx.lead.update({
          where: { id },
          data: { customerId: customer.id },
        });
      }

      return updatedLead;
    });
  }

  // ── Contact Logs ───────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/require-await
  async createContactLog(
    tenantId: string,
    userId: string,
    dto: CreateContactLogDto,
  ) {
    return this.prisma.contactLog.create({
      data: {
        tenantId,
        userId,
        customerId: dto.customerId,
        type: dto.type,
        subject: dto.subject,
        notes: dto.notes,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async getCrmTimeline(tenantId: string, customerId: string) {
    // Merges ContactLogs and automated Communications for a unified CRM view
    const [logs, communications] = await Promise.all([
      this.prisma.contactLog.findMany({
        where: { tenantId, customerId },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.communication.findMany({
        where: { tenantId, entityType: 'CUSTOMER', entityId: customerId },
      }),
    ]);

    const timeline = [
      ...logs.map((l) => ({
        id: l.id,
        date: l.date,
        type: l.type,
        subject: l.subject,
        body: l.notes,
        source: 'MANUAL',
        user: l.user.email,
      })),
      ...communications.map((c) => ({
        id: c.id,
        date: c.createdAt,
        type: c.channel,
        subject: c.subject,
        body: c.body,
        source: 'AUTOMATED',
        user: 'System',
      })),
    ];

    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: { tenantId, isTemplate: false, orderNumber: { not: null } },
    });
    return `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async createOrder(tenantId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new BadRequestException('Invalid customer reference');

    return this.prisma.order.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        type: dto.type,
        items: dto.items as any,
        totalAmount: dto.totalAmount,
        currency: dto.currency ?? 'USD',
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        notes: dto.notes,
        isTemplate: dto.isTemplate ?? false,
        templateFrequency: dto.templateFrequency,
        status: OrderStatus.DRAFT,
        orderNumber: null,
      },
      include: { customer: { select: { name: true, country: true } } },
    });
  }

  async getOrders(tenantId: string, filters?: GetOrdersFilterDto) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        isTemplate: filters?.isTemplate ?? false,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        customer: { select: { name: true, country: true, email: true } },
        _count: { select: { packedBoxes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        packedBoxes: {
          select: { boxId: true, status: true, varietyId: true, grade: true },
        },
        generatedOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
          },
        },
        template: { select: { id: true, orderNumber: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED],
    [OrderStatus.CONFIRMED]: [OrderStatus.IN_PICKING],
    [OrderStatus.IN_PICKING]: [OrderStatus.DISPATCHED],
    [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.INVOICED],
    [OrderStatus.INVOICED]: [],
  };

  async updateOrderStatus(
    tenantId: string,
    id: string,
    newStatus: OrderStatus,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = this.ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`,
      );
    }

    if (newStatus === OrderStatus.CONFIRMED) {
      const atp = await this.inventoryService.getFinishedGoodsATP(tenantId);
      const items = (order.items as unknown as OrderItemDto[]) || [];

      for (const item of items) {
        const match = atp.find(
          (a) =>
            a.varietyId === item.varietyId &&
            a.grade === item.grade &&
            a.bunchSize === item.bunchSize &&
            a.bunchesPerBox === item.bunchesPerBox,
        );
        if (!match || match.atp < item.quantity) {
          throw new BadRequestException(
            `Insufficient ATP for ${match?.varietyName ?? item.varietyName} Grade ${item.grade}: Available ${match?.atp ?? 0} boxes, requested ${item.quantity}`,
          );
        }
      }

      const orderNumber = await this.generateOrderNumber(tenantId);
      return this.prisma.order.update({
        where: { id },
        data: { status: newStatus, orderNumber },
        include: { customer: { select: { name: true } } },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: { customer: { select: { name: true } } },
    });
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getSalesStats(tenantId: string) {
    const [leads, totalCustomers, orders] = await Promise.all([
      this.prisma.lead.findMany({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.order.findMany({ where: { tenantId, isTemplate: false } }),
    ]);

    const activeLeads = leads.filter((l) => !['ACTIVE', 'LOST'].includes(l.status)).length;
    const pipelineValue = leads
      .filter((l) => !['ACTIVE', 'LOST'].includes(l.status))
      .reduce((sum, l) => sum + (l.value ?? 0), 0);
    const convertedLeads = leads.filter((l) => l.status === 'ACTIVE').length;
    const conversionRate =
      leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
    const activeOrders = orders.filter(
      (o) => !['DELIVERED', 'INVOICED'].includes(o.status),
    ).length;
    const totalRevenue = orders
      .filter((o) => o.status === 'INVOICED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      activeLeads,
      totalCustomers,
      pipelineValue,
      conversionRate: `${conversionRate}%`,
      activeOrders,
      totalRevenue,
    };
  }

  // ── Sales Invoices ─────────────────────────────────────────────────────────

  async getSalesInvoices(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: {
        order: {
          select: {
            orderNumber: true,
            type: true,
            currency: true,
            customer: { select: { name: true, country: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getOrderTemplates(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId, isTemplate: true },
      include: { customer: { select: { name: true, country: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateOrderFromTemplate(tenantId: string, templateId: string) {
    const template = await this.prisma.order.findFirst({
      where: { id: templateId, tenantId, isTemplate: true },
    });
    if (!template) throw new NotFoundException('Order template not found');

    return this.prisma.order.create({
      data: {
        tenantId,
        customerId: template.customerId,
        type: template.type,
        items: template.items as any,
        totalAmount: template.totalAmount,
        currency: template.currency,
        notes: template.notes,
        isTemplate: false,
        parentTemplateId: template.id,
        status: OrderStatus.DRAFT,
        orderNumber: null,
      },
      include: { customer: { select: { name: true, country: true } } },
    });
  }
}
