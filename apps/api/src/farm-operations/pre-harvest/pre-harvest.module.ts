import { Module } from '@nestjs/common';
import { PreHarvestService } from './pre-harvest.service';
import { PreHarvestController } from './pre-harvest.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreHarvestController],
  providers: [PreHarvestService],
  exports: [PreHarvestService],
})
export class PreHarvestModule {}
