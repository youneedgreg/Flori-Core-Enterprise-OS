import { Module } from '@nestjs/common';
import { IrrigationLogsService } from './irrigation-logs.service';
import { IrrigationLogsController } from './irrigation-logs.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IrrigationLogsController],
  providers: [IrrigationLogsService],
  exports: [IrrigationLogsService],
})
export class IrrigationLogsModule {}
