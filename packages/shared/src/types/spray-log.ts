export interface SprayLog {
  id: string;
  tenantId: string;
  zoneId: string;
  chemicalName: string;
  epaRegNo: string;
  quantity: number;
  unit: 'L' | 'Kg' | 'ml' | 'g';
  phiDays: number;
  applicatorId: string;
  appliedAt: Date | string;
  harvestAllowedAt: Date | string;
  notes?: string;
  overrideReason?: string;
  overriddenById?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateSprayLogDto {
  zoneId: string;
  chemicalName: string;
  epaRegNo: string;
  quantity: number;
  unit: 'L' | 'Kg' | 'ml' | 'g';
  phiDays: number;
  applicatorId: string;
  appliedAt?: string;
  notes?: string;
}
