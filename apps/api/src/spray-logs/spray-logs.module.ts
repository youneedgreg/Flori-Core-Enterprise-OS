import { Module } from '@nestjs/common';
import { SprayLogsService } from './spray-logs.service';
import { SprayLogsController } from './spray-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SprayLogsController],
  providers: [SprayLogsService],
  exports: [SprayLogsService],
})
export class SprayLogsModule {}
