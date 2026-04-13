/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../packing/storage.service';
import { NotificationService } from '../communications/notification.service';
import { EmployeeDocType, LeaveStatus, LeaveType } from '@prisma/client';

export interface LeaveRequestInput {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

@Injectable()
export class HRService {
  private readonly logger = new Logger(HRService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notification: NotificationService,
  ) {}

  async getEmployees(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async getEmployeeProfile(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: {
        documents: true,
        emergencyContacts: true,
        attendanceLogs: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        employmentHistory: { orderBy: { startDate: 'desc' } },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async createEmployee(tenantId: string, data: any) {
    return this.prisma.employee.create({
      data: { ...data, tenantId },
    });
  }

  async updateEmployee(tenantId: string, employeeId: string, data: any) {
    const { emergencyContacts, employmentHistory, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      // Update core employee info
      const employee = await tx.employee.update({
        where: { id: employeeId },
        data: { ...rest },
      });

      // Update emergency contacts if provided
      if (emergencyContacts) {
        await tx.emergencyContact.deleteMany({ where: { employeeId } });
        await tx.emergencyContact.createMany({
          data: emergencyContacts.map((c: any) => ({
            name: c.name,
            relationship: c.relationship,
            phone: c.phone,
            email: c.email,
            isPrimary: c.isPrimary || false,
            employeeId,
          })),
        });
      }

      // Update employment history if provided
      if (employmentHistory) {
        await tx.employmentHistory.deleteMany({ where: { employeeId } });
        await tx.employmentHistory.createMany({
          data: employmentHistory.map((h: any) => ({
            companyName: h.companyName,
            jobTitle: h.jobTitle,
            startDate: new Date(h.startDate),
            endDate: h.endDate ? new Date(h.endDate) : null,
            responsibilities: h.responsibilities,
            employeeId,
          })),
        });
      }

      return employee;
    });
  }

  async uploadDocument(
    tenantId: string,
    employeeId: string,
    type: EmployeeDocType,
    documentNumber: string,
    expiryDate: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const fileUrl = await this.storage.uploadFile(
      `hr/${employeeId}/${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype,
    );

    const doc = await this.prisma.employeeDocument.create({
      data: {
        employeeId,
        type,
        documentNumber,
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'ACTIVE',
      },
    });

    // Sync expiry dates back to Employee model for quick lookup
    if (type === EmployeeDocType.WORK_PERMIT) {
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          workPermitId: documentNumber,
          workPermitExpiry: expiryDate ? new Date(expiryDate) : null,
        },
      });
    } else if (type === EmployeeDocType.HEALTH_CERTIFICATE) {
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          healthCertExpiry: expiryDate ? new Date(expiryDate) : null,
        },
      });
    }

    return doc;
  }

  async getExpiringDocuments(tenantId: string, daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.prisma.employeeDocument.findMany({
      where: {
        employee: { tenantId },
        expiryDate: {
          gt: new Date(),
          lte: thresholdDate,
        },
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });
  }

  async notifyExpiries(tenantId: string) {
    const expiringDocs = await this.getExpiringDocuments(tenantId);

    for (const doc of expiringDocs) {
      const { employee } = doc;

      // 1. Notify the employee (if they have a user account)
      if (employee.userId) {
        await this.notification.createNotification({
          tenantId,
          userId: employee.userId,
          title: `Document Expiring Soon: ${doc.type}`,
          message: `Your ${doc.type.replace(/_/g, ' ')} is expiring on ${doc.expiryDate?.toLocaleDateString()}. Please update it.`,
        });
      }

      // 2. Notify HR team (Gold Admins & potential HR roles)
      const hrAdmins = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: { name: { in: ['gold_admin', 'hr_manager'] } },
        },
        select: { id: true },
      });

      for (const admin of hrAdmins) {
        await this.notification.createNotification({
          tenantId,
          userId: admin.id,
          title: `Employee Document Expiring: ${employee.firstName} ${employee.lastName}`,
          message: `${employee.firstName}'s ${doc.type.replace(/_/g, ' ')} is expiring on ${doc.expiryDate?.toLocaleDateString()}.`,
        });
      }
    }

    return expiringDocs.length;
  }

  async syncAttendanceLogs(tenantId: string, logs: any[]) {
    const results = { imported: 0, failed: 0, errors: [] as string[] };

    for (const log of logs) {
      try {
        // Find employee by biometricId
        const employee = await this.prisma.employee.findFirst({
          where: { biometricId: log.biometricId, tenantId },
          select: { id: true },
        });

        if (!employee) {
          results.failed++;
          results.errors.push(
            `Employee with Biometric ID ${log.biometricId} not found`,
          );
          continue;
        }

        await this.prisma.attendanceLog.create({
          data: {
            tenantId,
            employeeId: employee.id,
            type: log.type, // CHECK_IN or CHECK_OUT
            timestamp: new Date(log.timestamp),
            source: log.source || 'EXTERNAL_SYNC',
            metadata: log.metadata || {},
          },
        });

        results.imported++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(
          `Failed to import log for ${log.biometricId}: ${e.message}`,
        );
      }
    }

    return results;
  }

  // ─── Leave Management ───────────────────────────────────────────────────────

  async applyForLeave(
    tenantId: string,
    employeeId: string,
    data: LeaveRequestInput,
  ) {
    return this.prisma.leaveRequest.create({
      data: {
        ...data,
        employeeId,
        tenantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async getLeaveRequests(tenantId: string, employeeId?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeaveStatus(
    tenantId: string,
    requestId: string,
    status: LeaveStatus,
    adminId: string,
  ) {
    const request = await this.prisma.leaveRequest.update({
      where: { id: requestId, tenantId },
      data: { status, approvedById: adminId },
    });

    // If approved, potentially update employee status or trigger notifications
    if (status === LeaveStatus.APPROVED) {
      // Logic for when leave begins could be handled by a cron or manually
      // For now, we just approve it.
    }

    return request;
  }

  // ─── Shift Scheduling ───────────────────────────────────────────────────────

  async createShift(tenantId: string, data: any) {
    return this.prisma.shift.create({
      data: { ...data, tenantId },
    });
  }

  async getShifts(tenantId: string) {
    return this.prisma.shift.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async assignShift(
    tenantId: string,
    employeeId: string,
    shiftId: string,
    date: string,
  ) {
    return this.prisma.shiftAssignment.create({
      data: {
        tenantId,
        employeeId,
        shiftId,
        date: new Date(date),
      },
    });
  }

  async getShiftAssignments(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        tenantId,
        ...(startDate && endDate
          ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
            jobTitle: true,
          },
        },
        shift: true,
      },
    });
  }

  async deleteShiftAssignment(tenantId: string, assignmentId: string) {
    return this.prisma.shiftAssignment.delete({
      where: { id: assignmentId, tenantId },
    });
  }
}
