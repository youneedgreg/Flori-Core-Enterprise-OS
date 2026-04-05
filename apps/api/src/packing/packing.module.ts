import { Module } from '@nestjs/common';
import { PackingService } from './packing.service';
import { PackingController } from './packing.controller';
import { LabelService } from './label.service';
import { StorageService } from './storage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PackingController],
  providers: [PackingService, LabelService, StorageService],
  exports: [PackingService],
})
export class PackingModule {}
