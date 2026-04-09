import { Module } from '@nestjs/common';
import { ScoutingReportsService } from './scouting-reports.service';
import { ScoutingReportsController } from './scouting-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScoutingReportsController],
  providers: [ScoutingReportsService],
  exports: [ScoutingReportsService],
})
export class ScoutingReportsModule {}
