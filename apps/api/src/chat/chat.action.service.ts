/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatActionService {
  constructor(private prisma: PrismaService) {}

  async executeAction(
    tenantId: string,
    userId: string,
    actionType: string,
    payload: any,
  ) {
    switch (actionType) {
      case 'CREATE_GRN':
        return this.createGrn(tenantId, userId, payload);
      case 'CREATE_SPRAY_LOG':
        return this.createSprayLog(tenantId, userId, payload);
      case 'IMPORT_INVENTORY':
        return this.importInventory(tenantId, userId, payload);
      case 'CREATE_PURCHASE_REQUEST':
        return this.createPurchaseRequest(tenantId, userId, payload);
      case 'SCHEDULE_TRAINING':
        return this.scheduleTraining(tenantId, userId, payload);
      case 'SUBMIT_LEAVE_REQUEST':
        return this.submitLeaveRequest(tenantId, userId, payload);
      case 'CREATE_SCOUTING_REPORT':
        return this.createScoutingReport(tenantId, userId, payload);
      case 'SEND_NOTIFICATION':
        return this.sendNotification(tenantId, userId, payload);
      default:
        throw new HttpException(
          `Unknown action type: ${actionType}`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private async createPurchaseRequest(
    tenantId: string,
    userId: string,
    payload: any,
  ) {
    const { itemName, sku, quantity, notes } = payload;

    // Find item
    const storeItem = await this.prisma.storeItem.findFirst({
      where: {
        tenantId,
        OR: [
          sku ? { sku: { equals: sku, mode: 'insensitive' } } : {},
          itemName ? { name: { contains: itemName, mode: 'insensitive' } } : {},
        ].filter((obj) => Object.keys(obj).length > 0) as any,
      },
    });

    if (!storeItem) {
      throw new HttpException(
        `Item "${itemName || sku}" not found in inventory.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const pr = await this.prisma.purchaseRequest.create({
      data: {
        tenantId,
        itemId: storeItem.id,
        suggestedQty: quantity,
        notes: notes || `Requested via AI Chatbot`,
        generatedBy: userId,
        status: 'PENDING',
        currentStock: 0, // Should ideally be fetched from StoreStock
        reorderPoint: 0,
      },
    });

    return {
      success: true,
      message: `Created Purchase Request for ${quantity} x ${storeItem.name}`,
      id: pr.id,
    };
  }

  private async scheduleTraining(
    tenantId: string,
    userId: string,
    payload: any,
  ) {
    const { courseName, date, department, location, trainer } = payload;

    // Find course
    let course = await this.prisma.trainingCourse.findFirst({
      where: {
        tenantId,
        name: { contains: courseName, mode: 'insensitive' },
      },
    });

    if (!course) {
      course = await this.prisma.trainingCourse.create({
        data: {
          tenantId,
          name: courseName,
          category: 'GENERAL',
          description: 'Auto-created via Chat',
        },
      });
    }

    const schedule = await this.prisma.trainingSchedule.create({
      data: {
        tenantId,
        courseId: course.id,
        scheduledDate: new Date(date),
        department,
        location,
        trainer,
        status: 'SCHEDULED',
      },
    });

    return {
      success: true,
      message: `Scheduled ${course.name} for ${date} (${department || 'All Departments'})`,
      id: schedule.id,
    };
  }

  private async submitLeaveRequest(
    tenantId: string,
    userId: string,
    payload: any,
  ) {
    const { startDate, endDate, type, reason } = payload;

    // Find employee linked to this user
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw new HttpException(
        'You do not have an associated employee record to request leave.',
        HttpStatus.FORBIDDEN,
      );
    }

    const leave = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: employee.id,
        type: type || 'ANNUAL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || 'Requested via AI Chatbot',
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: `Leave request (${type}) submitted for ${startDate} to ${endDate}.`,
      id: leave.id,
    };
  }

  private async createScoutingReport(
    tenantId: string,
    userId: string,
    payload: any,
  ) {
    const { zoneName, pestName, severity, observations, date } = payload;

    // Find zone
    const zone = await this.prisma.zone.findFirst({
      where: {
        tenantId,
        name: { contains: zoneName, mode: 'insensitive' },
      },
    });

    if (!zone) {
      throw new HttpException(
        `Zone "${zoneName}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const report = await this.prisma.scoutingReport.create({
      data: {
        tenantId,
        zoneId: zone.id,
        pestDiseaseName: pestName,
        severity: severity || 'MODERATE',
        observations: observations || `Scouting report for ${pestName}`,
        date: date ? new Date(date) : new Date(),
        inspectorId: userId,
      },
    });

    return {
      success: true,
      message: `Logged ${severity} severity ${pestName} report for ${zone.name}.`,
      id: report.id,
    };
  }

  private async sendNotification(
    tenantId: string,
    userId: string,
    payload: any,
  ) {
    const { title, message, targetRole, targetUsers } = payload;

    let userIds: string[] = [];

    if (targetUsers && targetUsers.length > 0) {
      userIds = targetUsers;
    } else if (targetRole) {
      const usersWithRole = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: { name: { contains: targetRole, mode: 'insensitive' } },
        },
        select: { id: true },
      });
      userIds = usersWithRole.map((u) => u.id);
    }

    if (userIds.length === 0) {
      return {
        success: false,
        message: 'No target users found for notification.',
      };
    }

    await this.prisma.notification.createMany({
      data: userIds.map((id) => ({
        tenantId,
        userId: id,
        title,
        message,
        isRead: false,
      })),
    });

    return {
      success: true,
      message: `Sent notification "${title}" to ${userIds.length} users.`,
    };
  }

  private async createGrn(tenantId: string, userId: string, payload: any) {
    // payload should have vendorName, items: { sku, quantity, unitPrice }[]
    const { vendorName, items } = payload;

    // Find or create vendor
    let vendor = await this.prisma.vendor.findFirst({
      where: { tenantId, name: { contains: vendorName, mode: 'insensitive' } },
    });

    if (!vendor) {
      vendor = await this.prisma.vendor.create({
        data: { tenantId, name: vendorName, email: 'unknown@example.com' },
      });
    }

    // Auto create PO if not exists
    const poNumber = `PO-${Date.now()}`;
    const po = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        poNumber,
        vendorId: vendor.id,
        status: 'RECEIVED',
        totalAmount: items.reduce(
          (acc: number, item: any) => acc + item.quantity * item.unitPrice,
          0,
        ),
        createdById: userId,
      },
    });

    // Create GRN
    const grnNumber = `GRN-${Date.now()}`;
    const grn = await this.prisma.goodsReceivedNote.create({
      data: {
        tenantId,
        poId: po.id,
        grnNumber,
        vendorId: vendor.id,
        receivedById: userId,
        status: 'RECONCILED',
      },
    });

    for (const item of items) {
      // Find item
      let storeItem = await this.prisma.storeItem.findUnique({
        where: { tenantId_sku: { tenantId, sku: item.sku } },
      });
      if (!storeItem) {
        storeItem = await this.prisma.storeItem.create({
          data: { tenantId, name: item.sku, sku: item.sku, category: 'OTHER' },
        });
      }

      await this.prisma.grnItem.create({
        data: {
          grnId: grn.id,
          itemId: storeItem.id,
          quantityReceived: item.quantity,
          unitPriceReceived: item.unitPrice,
          totalPriceReceived: item.quantity * item.unitPrice,
        },
      });
    }

    return {
      success: true,
      message: `Created GRN ${grnNumber} from delivery note.`,
    };
  }

  private async createSprayLog(tenantId: string, userId: string, payload: any) {
    const { chemicalName, zoneId, phiDays, quantity, unit, date } = payload;

    await this.prisma.sprayLog.create({
      data: {
        tenantId,
        zoneId: zoneId || 'default-zone', // Needs proper resolution
        chemicalName,
        epaRegNo: 'UNKNOWN',
        quantity,
        unit: unit || 'L',
        phiDays: phiDays || 0,
        applicatorId: userId,
        appliedAt: new Date(date),
        harvestAllowedAt: new Date(
          new Date(date).getTime() + (phiDays || 0) * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return { success: true, message: `Imported spray log for ${chemicalName}` };
  }

  private async importInventory(
    tenantId: string,
    userId: string,
    payload: any,
  ) {
    const { items } = payload; // { sku, name, category, quantity, unitCost }[]
    let imported = 0;

    for (const item of items) {
      if (!item.sku || !item.name) continue;

      let storeItem = await this.prisma.storeItem.findUnique({
        where: { tenantId_sku: { tenantId, sku: item.sku } },
      });

      if (!storeItem) {
        storeItem = await this.prisma.storeItem.create({
          data: {
            tenantId,
            sku: item.sku,
            name: item.name,
            category: item.category || 'OTHER',
            unitCost: item.unitCost || 0,
          },
        });
      }

      imported++;
    }

    return {
      success: true,
      message: `Imported ${imported} items into inventory.`,
    };
  }
}
