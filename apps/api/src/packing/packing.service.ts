import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabelService, LabelData } from './label.service';
import { StorageService } from './storage.service';
import { Prisma, QCGrade } from '@prisma/client';

export interface PackBoxDto {
  varietyId: string;
  grade: QCGrade;
  bunchSize: number;
  bunchesPerBox: number;
  batchId?: string; // Optional: Can pack from specific batch or general inventory
  destination?: string;
}

@Injectable()
export class PackingService {
  private readonly logger = new Logger(PackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly labelService: LabelService,
    private readonly storageService: StorageService,
  ) {}

  async packBox(tenantId: string, data: PackBoxDto) {
    const totalStems = data.bunchSize * data.bunchesPerBox;

    if (totalStems <= 0) {
      throw new BadRequestException('Total stems must be greater than zero.');
    }

    // 1. Validate Inventory / Batch & Tenant Profile
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { farmProfile: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const variety = await this.prisma.variety.findUnique({
      where: { id: data.varietyId },
    });

    if (!variety || variety.tenantId !== tenantId) {
      throw new NotFoundException('Variety not found');
    }

    let batchNumber: string | undefined = undefined;

    // We do a transaction to ensure atomic inventory decrement + box creation
    return await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 2. Decrement Inventory
        if (data.batchId) {
          // Option A: Packing from a specific batch (assuming batch.quantity remaining logic is handled)
          const batch = await tx.flowerBatch.findFirst({
            where: { id: data.batchId, tenantId },
          });

          if (!batch) {
            throw new NotFoundException(
              'Flower batch not found or does not belong to tenant.',
            );
          }

          if (batch.varietyId !== data.varietyId) {
            throw new BadRequestException(
              'Batch variety does not match selected variety.',
            );
          }

          batchNumber = batch.batchNumber;

          // Decrement general inventory since it was added to inventory on QC
          await this.decrementInventory(
            tx,
            tenantId,
            data.varietyId,
            data.grade,
            totalStems,
          );
        } else {
          // Option B: Packing from general stock
          await this.decrementInventory(
            tx,
            tenantId,
            data.varietyId,
            data.grade,
            totalStems,
          );
        }

        // 3. Generate Box ID
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await tx.packedBox.count({
          where: {
            boxId: { startsWith: `BOX-${dateStr}` },
          },
        });
        const sequence = (count + 1).toString().padStart(4, '0');
        const boxId = `BOX-${dateStr}-${sequence}`;

        // 4. Create Packed Box Entry without labelUrl first
        const box = await tx.packedBox.create({
          data: {
            tenantId,
            batchId: data.batchId,
            varietyId: data.varietyId,
            grade: data.grade,
            boxId,
            bunchSize: data.bunchSize,
            bunchesPerBox: data.bunchesPerBox,
            totalStems,
            destination: data.destination,
            status: 'PACKED',
          },
        });

        // 5. Generate and Upload Label
        try {
          const labelData: LabelData = {
            boxId: box.boxId,
            batchNumber: batchNumber,
            varietyName: variety.name,
            grade: box.grade.toString(),
            bunchSize: box.bunchSize,
            bunchesPerBox: box.bunchesPerBox,
            totalStems: box.totalStems,
            packDate: today.toLocaleDateString(),
            destination: box.destination || undefined,
            tenantName: tenant.farmProfile?.name || tenant.name,
            logoUrl: tenant.farmProfile?.logoUrl || undefined,
          };

          const pdfBuffer = await this.labelService.generateLabelPDF(labelData);
          const fileName = `${box.boxId}.pdf`;
          const labelUrl = await this.storageService.uploadFile(
            fileName,
            pdfBuffer,
            'application/pdf',
          );

          // Update box with label URL
          return await tx.packedBox.update({
            where: { id: box.id },
            data: { labelUrl },
            include: { variety: true, batch: true },
          });
        } catch (error: unknown) {
          this.logger.error(
            `Failed to generate/upload label for Box ${box.boxId}:`,
            error instanceof Error ? error.stack : String(error),
          );
          // Optionally, we could throw here, which would rollback the transaction,
          // meaning the box isn't packed if the label fails. Let's do that for safety.
          throw new BadRequestException(
            'Failed to generate box label. Packing cancelled.',
          );
        }
      },
    );
  }

  private async decrementInventory(
    tx: Prisma.TransactionClient,
    tenantId: string,
    varietyId: string,
    grade: QCGrade,
    amount: number,
  ) {
    const inventory = await tx.flowerInventory.findUnique({
      where: {
        tenantId_varietyId_grade: {
          tenantId,
          varietyId,
          grade,
        },
      },
    });

    if (!inventory || inventory.quantity < amount) {
      throw new BadRequestException(
        `Insufficient inventory for ${grade} grade. Available: ${inventory?.quantity || 0}, Required: ${amount}`,
      );
    }

    await tx.flowerInventory.update({
      where: { id: inventory.id },
      data: { quantity: { decrement: amount } },
    });
  }

  async getPackedBoxes(tenantId: string) {
    return this.prisma.packedBox.findMany({
      where: { tenantId },
      include: { variety: true, batch: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
