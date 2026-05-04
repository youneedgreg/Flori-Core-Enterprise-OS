/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../packing/storage.service';
import { EmailService } from '../communications/email.service';
import { ExportDocType } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

@Injectable()
export class ExportDocsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly emailService: EmailService,
  ) {}

  async getDocumentsByOrder(tenantId: string, orderId: string) {
    return this.prisma.exportDocument.findMany({
      where: { tenantId, orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateDocument(
    tenantId: string,
    orderId: string,
    type: ExportDocType,
    notes?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
      include: {
        customer: true,
        tenant: { include: { farmProfile: true } },
        packedBoxes: {
          include: {
            batch: {
              include: {
                cropCycle: {
                  include: {
                    zone: {
                      include: {
                        sprayLogs: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Generate PDF buffer
    const buffer = await this.createPdfBuffer(order, type, notes);

    // Upload to S3 (using StorageService from PackingModule)
    const filename = `export_docs/${orderId}/${type}_${Date.now()}.pdf`;
    const fileUrl = await this.storage.uploadFile(
      filename,
      buffer,
      'application/pdf',
    );

    // Create DB record
    return this.prisma.exportDocument.create({
      data: {
        tenantId,
        orderId,
        type,
        fileUrl,
        documentNumber:
          `DOC-${type}-${order.orderNumber || orderId.slice(0, 6)}`.toUpperCase(),
        notes,
        status: 'GENERATED',
      },
    });
  }

  async uploadDocument(
    tenantId: string,
    orderId: string,
    file: any,
    type: ExportDocType,
    notes?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const filename = `export_docs/${orderId}/${type}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileUrl = await this.storage.uploadFile(
      filename,
      file.buffer,
      file.mimetype,
    );

    return this.prisma.exportDocument.create({
      data: {
        tenantId,
        orderId,
        type,
        fileUrl,
        documentNumber:
          `DOC-${type}-${order.orderNumber || orderId.slice(0, 6)}`.toUpperCase(),
        notes,
        status: 'GENERATED',
      },
    });
  }

  async emailDocument(tenantId: string, docId: string, to: string) {
    const doc = await this.prisma.exportDocument.findUnique({
      where: { id: docId, tenantId },
      include: { order: true },
    });

    if (!doc) throw new NotFoundException('Document not found');

    let pdfBuffer: Buffer;
    if (doc.fileUrl.startsWith('http')) {
      const res = await fetch(doc.fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } else {
      // It's local path
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), doc.fileUrl);
      pdfBuffer = fs.readFileSync(localPath);
    }

    // Send email
    await this.emailService.sendEmail({
      to,
      subject: `Flori-Core Export Document: ${doc.type.replace('_', ' ')}`,
      html: `<p>Please find attached the requested export documentation (${doc.type.replace('_', ' ')}) for Order #${doc.order.orderNumber || doc.order.id.slice(0, 6)}.</p>`,
      tenantId,
      entityType: 'EXPORT_DOCUMENT',
      entityId: doc.id,
      attachments: [
        {
          filename: `${doc.type}_${doc.order.orderNumber || doc.order.id.slice(0, 6)}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Update status
    return this.prisma.exportDocument.update({
      where: { id: docId },
      data: { status: 'SENT' },
    });
  }

  private createPdfBuffer(
    order: any,
    type: string,
    notes?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .text(
          order.tenant?.farmProfile?.name ||
            order.tenant?.name ||
            'Flori-Core OS',
          { align: 'center' },
        );
      doc.moveDown();
      doc
        .fontSize(16)
        .text(type.replace('_', ' '), { align: 'center', underline: true });
      doc.moveDown();

      // Order info
      doc.fontSize(12).text(`Order Ref: ${order.orderNumber || order.id}`);
      doc.text(`Customer: ${order.customer?.name}`);
      doc.text(`Destination: ${order.customer?.country || 'Unknown'}`);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Type-specific content blocks
      if (type === 'PHYTOSANITARY') {
        doc.text(
          'This is to certify that the plants, plant products or other regulated articles described herein have been inspected and/or tested according to appropriate official procedures and are considered to be free from the quarantine pests specified by the importing contracting party.',
        );
        doc.moveDown();

        // Extract unique spray logs from packed boxes -> batch -> cycle -> zone
        const sprayLogs = new Map<string, any>();
        order.packedBoxes?.forEach((box: any) => {
          box.batch?.cropCycle?.zone?.sprayLogs?.forEach((log: any) => {
            sprayLogs.set(log.id, log);
          });
        });

        if (sprayLogs.size > 0) {
          doc.text('Treatment / Spray Logs:');
          Array.from(sprayLogs.values()).forEach((log: any, i: number) => {
            doc.text(
              ` ${i + 1}. ${log.chemicalName} (EPA: ${log.epaRegNo}) - Applied: ${new Date(log.appliedAt).toLocaleDateString()}`,
            );
          });
        } else {
          doc.text(
            'Treatment: N/A - No Spray Logs associated with these items.',
          );
        }
      } else if (type === 'CUSTOMS_INVOICE' || type === 'PACKING_LIST') {
        doc.text(`Total Value: ${order.currency} ${order.totalAmount}`);
        doc.moveDown();
        doc.text('Box Manifest:');

        if (order.packedBoxes && order.packedBoxes.length > 0) {
          order.packedBoxes.forEach((box: any, i: number) => {
            doc.text(
              ` Box ${i + 1} (${box.boxId}): ${box.totalStems} stems - ${box.bunchesPerBox} bunches/box`,
            );
          });
        } else {
          doc.text(' No packed boxes found for this order.');
        }
      } else if (type === 'CERTIFICATE_OF_ORIGIN') {
        doc.text(
          `Country of Origin: ${order.tenant?.farmProfile?.location || 'Kenya'}`,
        );
        doc.text(`Exported to: ${order.customer?.country}`);
      }

      doc.moveDown();
      if (notes) {
        doc.text('Notes:');
        doc.text(notes);
        doc.moveDown();
      }

      doc
        .fontSize(10)
        .text('Generated automatically by Flori-Core Enterprise OS.', {
          align: 'center',
        });

      doc.end();
    });
  }
}
