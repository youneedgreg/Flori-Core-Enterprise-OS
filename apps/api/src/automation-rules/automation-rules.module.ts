import { Module } from '@nestjs/common';
import { AutomationRulesService } from './automation-rules.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AutomationRulesService],
  exports: [AutomationRulesService],
})
export class AutomationRulesModule {}
