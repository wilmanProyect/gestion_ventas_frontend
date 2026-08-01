export interface SaleItem {
  id: string;
  varietyId: string;
  varietyName: string;
  lotItemId: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  paymentMethod: 'CASH' | 'QR' | 'TRANSFER' | 'MIXED';
  cashAmount: number;
  qrAmount: number;
  transferAmount: number;
  totalPaid: number;
  proofUrl: string | null;
  createdAt?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  registeredById: string;
  totalPrice: number;
  status: 'COMPLETED' | 'RETURNED';
  createdAt: string;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface ReservationItem {
  id: string;
  varietyId: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  customerName: string;
  customerPhone?: string;
  status: 'PENDING' | 'PICKED_UP' | 'CANCELLED';
  registeredById: string;
  totalPrice: number;
  createdAt: string;
  items?: ReservationItem[];
  payments?: Payment[];
}
