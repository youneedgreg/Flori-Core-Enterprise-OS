import { Module } from '@nestjs/common';
import { ExportDocsService } from './export-docs.service';
import { ExportDocsController } from './export-docs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';
import { PackingModule } from '../packing/packing.module';

@Module({
  imports: [PrismaModule, CommunicationsModule, PackingModule],
  controllers: [ExportDocsController],
  providers: [ExportDocsService],
  exports: [ExportDocsService],
})
export class ExportDocsModule {}
