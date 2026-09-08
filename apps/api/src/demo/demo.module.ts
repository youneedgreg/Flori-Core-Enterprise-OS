import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';

// PrismaModule is @Global, so PrismaService is already available here.
@Module({ controllers: [DemoController] })
export class DemoModule {}
