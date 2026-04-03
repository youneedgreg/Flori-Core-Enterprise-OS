import { Module } from '@nestjs/common';
import { PackHouseController } from './pack-house.controller';
import { PackHouseService } from './pack-house.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PackHouseController],
  providers: [PackHouseService],
  exports: [PackHouseService],
})
export class PackHouseModule {}
