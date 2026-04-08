import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcurementService } from './procurement.service';

@Injectable()
export class ProcurementScheduler {
  private readonly logger = new Logger(ProcurementScheduler.name);

  constructor(private readonly procurementService: ProcurementService) {}

  /**
   * Runs every hour to scan all tenant inventories for items below
   * their reorder point and auto-generates purchase requests.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyLowStockScan() {
    this.logger.log('⏰ Hourly low-stock scan triggered');
    try {
      const result = await this.procurementService.runLowStockScan();
      this.logger.log(
        `✅ Scan complete — PRs created: ${result.created}, skipped (already pending): ${result.skipped}`,
      );
    } catch (err) {
      this.logger.error('❌ Low-stock scan failed:', err);
    }
  }
}
