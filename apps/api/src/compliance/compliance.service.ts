/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../packing/storage.service';
import { EmailService } from '../communications/email.service';
import { CertificationType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

export class CreateCertificationDto {
  type: CertificationType;
  customName?: string;
  issuedBy?: string;
  certNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly emailService: EmailService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────────

  async getCertifications(tenantId: string) {
    const certs = await (this.prisma as any).certification.findMany({
      where: { tenantId },
      orderBy: { expiryDate: 'asc' },
    });

    const now = new Date();
    // Compute derived status on the fly
    return certs.map((c: any) => ({
      ...c,
      daysUntilExpiry: c.expiryDate
        ? Math.ceil(
            (new Date(c.expiryDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
      computedStatus: !c.expiryDate
        ? 'ACTIVE'
        : new Date(c.expiryDate) < now
          ? 'EXPIRED'
          : Math.ceil(
                (new Date(c.expiryDate).getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              ) <= 30
            ? 'EXPIRING_SOON'
            : 'ACTIVE',
    }));
  }

  async createCertification(tenantId: string, dto: CreateCertificationDto) {
    return (this.prisma as any).certification.create({
      data: {
        tenantId,
        type: dto.type,
        customName: dto.customName,
        issuedBy: dto.issuedBy,
        certNumber: dto.certNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        notes: dto.notes,
      },
    });
  }

  async updateCertification(
    tenantId: string,
    id: string,
    dto: Partial<CreateCertificationDto>,
  ) {
    const cert = await (this.prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!cert) throw new NotFoundException('Certification not found');

    return (this.prisma as any).certification.update({
      where: { id },
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async deleteCertification(tenantId: string, id: string) {
    const cert = await (this.prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!cert) throw new NotFoundException('Certification not found');
    await (this.prisma as any).certification.delete({ where: { id } });
    return { success: true };
  }

  async uploadCertFile(
    tenantId: string,
    id: string,
    buffer: Buffer,
    originalname: string,
  ) {
    const cert = await (this.prisma as any).certification.findFirst({
      where: { id, tenantId },
    });
    if (!cert) throw new NotFoundException('Certification not found');

    const ext = originalname.split('.').pop() ?? 'pdf';
    const filename = `certifications/${tenantId}/${id}_${Date.now()}.${ext}`;
    const fileUrl = await this.storage.uploadFile(
      filename,
      buffer,
      'application/pdf',
    );

    return (this.prisma as any).certification.update({
      where: { id },
      data: { fileUrl },
    });
  }

  // ── Expiry Reminder Cron (daily at 8am) ─────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendExpiryReminders() {
    this.logger.log('Running certification expiry reminder check...');
    const now = new Date();

    const thresholds = [60, 30];
    for (const days of thresholds) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const expiring = await (this.prisma as any).certification.findMany({
        where: {
          expiryDate: { gte: startOfDay, lte: endOfDay },
        },
        include: { tenant: { include: { users: { take: 1 } } } },
      });

      for (const cert of expiring) {
        const adminEmail = cert.tenant?.users?.[0]?.email;
        if (!adminEmail) continue;

        const label = cert.customName || cert.type.replace(/_/g, ' ');
        await this.emailService.sendEmail({
          to: adminEmail,
          subject: `⚠️ Certification Expiring in ${days} Days: ${label}`,
          html: `<p>Your <strong>${label}</strong> certification (Cert #${cert.certNumber || 'N/A'}) is expiring in <strong>${days} days</strong> on <strong>${new Date(cert.expiryDate).toLocaleDateString()}</strong>.</p><p>Please initiate renewal to avoid compliance gaps.</p>`,
          tenantId: cert.tenantId,
          entityType: 'CERTIFICATION',
          entityId: cert.id,
        });

        await (this.prisma as any).certification.update({
          where: { id: cert.id },
          data: { remindersSent: { increment: 1 }, status: 'EXPIRING_SOON' },
        });

        this.logger.log(
          `Reminder sent for cert ${cert.id} (${label}) to ${adminEmail}`,
        );
      }
    }
  }

  // ── Audit Report PDF Generator ───────────────────────────────────────────────

  async generateAuditReport(
    tenantId: string,
    reportType: 'SPRAY_LOG' | 'LABOUR' | 'FULL_COMPLIANCE',
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo) : undefined;
    const dateFilter = from || to ? { gte: from, lte: to } : undefined;

    const [tenant, sprayLogs, labourLogs, certifications] = await Promise.all([
      (this.prisma as any).tenant.findUnique({
        where: { id: tenantId },
        include: { farmProfile: true },
      }),
      (this.prisma as any).sprayLog.findMany({
        where: { tenantId, ...(dateFilter ? { appliedAt: dateFilter } : {}) },
        include: {
          zone: { select: { name: true } },
          applicator: { select: { email: true } },
        },
        orderBy: { appliedAt: 'desc' },
        take: 200,
      }),
      (this.prisma as any).labourLog.findMany({
        where: { tenantId, ...(dateFilter ? { timestamp: dateFilter } : {}) },
        include: {
          zone: { select: { name: true } },
          user: { select: { email: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 200,
      }),
      (this.prisma as any).certification.findMany({
        where: { tenantId },
        orderBy: { expiryDate: 'asc' },
      }),
    ]);

    const farmName =
      tenant?.farmProfile?.name || tenant?.name || 'Flori-Core OS';

    const buffer = await this.buildAuditPdf({
      farmName,
      reportType,
      from,
      to,
      sprayLogs,
      labourLogs,
      certifications,
    });

    const filename = `audit_report_${reportType}_${Date.now()}.pdf`;

    // Also upload to S3 for audit trail
    await this.storage.uploadFile(
      `audit_reports/${tenantId}/${filename}`,
      buffer,
      'application/pdf',
    );

    return { buffer, filename };
  }

  private buildAuditPdf(data: {
    farmName: string;
    reportType: string;
    from?: Date;
    to?: Date;
    sprayLogs: any[];
    labourLogs: any[];
    certifications: any[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const fmt = (d?: Date) =>
        d ? new Date(d).toLocaleDateString('en-GB') : '—';

      // Cover
      doc.fontSize(22).text(data.farmName, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(16)
        .text(
          `Compliance Audit Report: ${data.reportType.replace(/_/g, ' ')}`,
          {
            align: 'center',
            underline: true,
          },
        );
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .text(
          `Period: ${fmt(data.from)} – ${fmt(data.to)} | Generated: ${fmt(new Date())}`,
          { align: 'center' },
        );
      doc.moveDown(1);

      // Certifications summary
      if (
        data.reportType === 'FULL_COMPLIANCE' ||
        data.reportType === 'SPRAY_LOG'
      ) {
        doc.fontSize(13).text('Active Certifications', { underline: true });
        doc.moveDown(0.5);
        if (data.certifications.length === 0) {
          doc.fontSize(10).text('No certifications on record.');
        } else {
          data.certifications.forEach((c: any) => {
            const label = c.customName || c.type.replace(/_/g, ' ');
            doc
              .fontSize(10)
              .text(
                `• ${label}  |  Cert #: ${c.certNumber || 'N/A'}  |  Issued: ${fmt(c.issueDate)}  |  Expiry: ${fmt(c.expiryDate)}  |  Status: ${c.status}`,
              );
          });
        }
        doc.moveDown(1);
      }

      // Spray Logs
      if (
        data.reportType === 'SPRAY_LOG' ||
        data.reportType === 'FULL_COMPLIANCE'
      ) {
        doc.fontSize(13).text('Chemical Spray Log', { underline: true });
        doc.moveDown(0.5);
        if (data.sprayLogs.length === 0) {
          doc.fontSize(10).text('No spray logs in this period.');
        } else {
          data.sprayLogs.forEach((s: any) => {
            doc
              .fontSize(9)
              .text(
                `${fmt(s.appliedAt)} | Zone: ${s.zone?.name || '?'} | ${s.chemicalName} (EPA: ${s.epaRegNo}) | ${s.quantity} ${s.unit} | PHI: ${s.phiDays}d | By: ${s.applicator?.email || '?'}`,
              );
          });
        }
        doc.moveDown(1);
      }

      // Labour Logs
      if (
        data.reportType === 'LABOUR' ||
        data.reportType === 'FULL_COMPLIANCE'
      ) {
        doc.fontSize(13).text('Labour Records', { underline: true });
        doc.moveDown(0.5);
        if (data.labourLogs.length === 0) {
          doc.fontSize(10).text('No labour logs in this period.');
        } else {
          data.labourLogs.forEach((l: any) => {
            doc
              .fontSize(9)
              .text(
                `${fmt(l.timestamp)} | Zone: ${l.zone?.name || '?'} | Task: ${l.taskType} | ${l.hours}h | Worker: ${l.user?.email || '?'}`,
              );
          });
        }
      }

      doc.moveDown(2);
      doc
        .fontSize(9)
        .text('Generated automatically by Flori-Core Enterprise OS.', {
          align: 'center',
        });

      doc.end();
    });
  }
}
