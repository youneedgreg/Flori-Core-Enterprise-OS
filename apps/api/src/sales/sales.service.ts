/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, CustomerType, CustomerSegment } from '@prisma/client';

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

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
