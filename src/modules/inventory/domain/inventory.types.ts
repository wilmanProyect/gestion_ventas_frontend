export interface Variety {
  id: string;
  name: string;
  description: string;
}

export interface LotItem {
  id: string;
  varietyId: string;
  varietyName: string;
  quantityInitial: number;
  quantityCurrent: number;
  pricePerQuintal: number;
}

export interface Lot {
  id: string;
  lotNumber: string;
  receiptUrl: string | null;
  createdAt: string;
  items: LotItem[];
}

export interface InventorySummaryItem {
  varietyId: string;
  name: string;
  description: string;
  totalStock: number;
}

export interface InventoryReport {
  summary: InventorySummaryItem[];
  lots: Lot[];
}

export interface InventoryMovement {
  id: string;
  lotItemId: string;
  type: 'INPUT' | 'OUTPUT';
  quantity: number;
  reason: string;
  registeredById: string;
  attachmentUrl: string | null;
  createdAt: string;
}
