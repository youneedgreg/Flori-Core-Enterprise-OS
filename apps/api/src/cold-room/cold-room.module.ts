import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ColdRoomController } from './cold-room.controller';
import { ColdRoomService } from './cold-room.service';

@Module({
  imports: [PrismaModule],
  controllers: [ColdRoomController],
  providers: [ColdRoomService],
  exports: [ColdRoomService],
})
export class ColdRoomModule {}
