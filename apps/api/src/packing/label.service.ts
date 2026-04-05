import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

export interface LabelData {
  boxId: string;
  batchNumber?: string;
  varietyName: string;
  grade: string;
  bunchSize: number;
  bunchesPerBox: number;
  totalStems: number;
  packDate: string;
  destination?: string;
  tenantName: string;
  logoUrl?: string; // We can potentially fetch this and embed it, but usually, it's a remote URL.
}

@Injectable()
export class LabelService {
  async generateLabelPDF(data: LabelData): Promise<Buffer> {
    // Generate QR Code first (async work done BEFORE opening the PDF stream)
    const qrDataPayload = JSON.stringify({
      bx: data.boxId,
      b: data.batchNumber,
      v: data.varietyName,
      g: data.grade,
      s: data.totalStems,
      d: data.packDate,
    });

    const qrImageBuffer = await QRCode.toBuffer(qrDataPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 100,
    });

    // Wrap only the synchronous stream events in a Promise (no async executor)
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [288, 432], margin: 20 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Building the Layout ---

      // Tenant Name / Header
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(data.tenantName, { align: 'center' });
      doc.moveDown(0.5);

      // A placeholder for Logo if logoUrl is provided
      // Real implementation would download the logo first, here we just show text.
      if (data.logoUrl) {
        doc
          .fillColor('gray')
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text('(Logo Provided)', { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(1);
      }

      // Line separator
      doc.moveTo(20, doc.y).lineTo(268, doc.y).stroke();
      doc.moveDown();

      // Variety & Grade
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(data.varietyName.toUpperCase(), { align: 'center' });
      doc
        .fontSize(14)
        .font('Helvetica')
        .text(`Grade: ${data.grade}`, { align: 'center' });
      doc.moveDown();

      // Technical details table
      doc.fontSize(12).font('Helvetica');
      const startY = doc.y;

      doc.text(`Bunch Size:`, 20, startY);
      doc.font('Helvetica-Bold');
      doc.text(`${data.bunchSize}`, 120, startY);

      doc.font('Helvetica');
      doc.text(`Bunches/Box:`, 20, startY + 15);
      doc.font('Helvetica-Bold');
      doc.text(`${data.bunchesPerBox}`, 120, startY + 15);

      doc.font('Helvetica');
      doc.text(`Total Stems:`, 20, startY + 30);
      doc.font('Helvetica-Bold');
      doc.text(`${data.totalStems}`, 120, startY + 30);

      doc.font('Helvetica').text(`Pack Date:`, 20, startY + 45);
      doc.font('Helvetica').text(data.packDate, 120, startY + 45);

      if (data.batchNumber) {
        doc.font('Helvetica').text(`Batch No:`, 20, startY + 60);
        doc.font('Helvetica').text(data.batchNumber, 120, startY + 60);
      }

      if (data.destination) {
        doc.font('Helvetica').text(`Destination:`, 20, startY + 75);
        doc.font('Helvetica').text(data.destination, 120, startY + 75);
      }

      doc.moveDown(5);

      // Box ID
      doc.fontSize(10);
      doc.font('Helvetica');
      doc.text('Box ID:', { align: 'center' });
      doc.fontSize(12);
      doc.font('Courier-Bold');
      doc.text(data.boxId, { align: 'center' });

      // Draw QR code at bottom center (buffer already generated above)
      doc.image(qrImageBuffer, (288 - 100) / 2, 300, { width: 100 });

      doc.end();
    });
  }
}
