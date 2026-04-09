import { Module } from '@nestjs/common';
import { SoilTestsService } from './soil-tests.service';
import { SoilTestsController } from './soil-tests.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SoilTestsController],
  providers: [SoilTestsService],
  exports: [SoilTestsService],
})
export class SoilTestsModule {}
