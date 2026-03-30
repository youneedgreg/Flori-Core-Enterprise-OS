import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    // In a real app, these would be aggregated from their respective models.
    // Since we are building the Master Dashboard (v1.3), we'll provide simulated data.
    return {
      kpis: [
        {
          id: 'harvest',
          label: "Today's Harvest",
          value: '1,240 kg',
          trend: '+12%',
          trendDirection: 'up',
          color: 'emerald',
        },
        {
          id: 'orders',
          label: 'Active Orders',
          value: '48',
          trend: '+5',
          trendDirection: 'up',
          color: 'blue',
        },
        {
          id: 'cold-room',
          label: 'Cold Room Status',
          value: '3.2°C',
          trend: 'Stable',
          trendDirection: 'neutral',
          color: 'cyan',
        },
        {
          id: 'payroll',
          label: 'Payroll Due',
          value: '$12,450',
          trend: 'Due in 3d',
          trendDirection: 'down',
          color: 'amber',
        },
      ],
      recentActivity: [
        {
          id: 1,
          type: 'HARVEST',
          message: 'Harvest completed at Zone A',
          time: '10m ago',
        },
        {
          id: 2,
          type: 'ORDER',
          message: 'New export order from Bloom & Wild',
          time: '25m ago',
        },
        {
          id: 3,
          type: 'ALERT',
          message: 'Moisture sensor low in Zone C',
          time: '1h ago',
        },
        {
          id: 4,
          type: 'LOGISTICS',
          message: 'Truck 04 departed for Nairobi',
          time: '2h ago',
        },
      ],
    };
  }
}
