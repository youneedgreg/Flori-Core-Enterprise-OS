import { Module } from '@nestjs/common';
import { VarietiesService } from './varieties.service';
import { VarietiesController } from './varieties.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VarietiesController],
  providers: [VarietiesService],
  exports: [VarietiesService],
})
export class VarietiesModule {}
