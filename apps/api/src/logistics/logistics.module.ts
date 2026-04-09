import { Module } from '@nestjs/common';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

import { PackingModule } from '../packing/packing.module';
import { FinancialsModule } from '../financials/financials.module';
import { LocationGateway } from './location.gateway';

@Module({
  imports: [PrismaModule, InventoryModule, PackingModule, FinancialsModule],
  controllers: [LogisticsController],
  providers: [LogisticsService, LocationGateway],
  exports: [LogisticsService],
})
export class LogisticsModule {}
