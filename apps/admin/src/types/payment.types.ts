export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'POS';
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'REFUNDED' | 'FAILED';
export type PaymentCategory = 'PACKAGE_PURCHASE' | 'APPOINTMENT' | 'WORKSHOP_TICKET' | 'STORE_SALE';

export interface PaymentItem {
  id: string;
  studioId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  category: PaymentCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  customerName: string;
  customerEmail: string;
  amount: number;
  method: PaymentMethod;
  category: PaymentCategory;
  description: string;
}