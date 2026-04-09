import { Module } from '@nestjs/common';
import { LandPrepService } from './land-prep.service';
import { LandPrepController } from './land-prep.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LandPrepController],
  providers: [LandPrepService],
  exports: [LandPrepService],
})
export class LandPrepModule {}
