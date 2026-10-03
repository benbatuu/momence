import { api } from './api';

export interface FinancialSummary {
  totalRevenue: number;
  breakdown: {
    packages: number;
    storeProducts: number;
    videos: number;
  };
  transactionCount: number;
}

export interface TransactionItem {
  id: string;
  amount: number;
  paymentMethod: 'CREDIT_CARD' | 'CASH' | 'EFT' | 'PAYTR';
  sourceCategory: 'PACKAGE' | 'STORE_PRODUCT' | 'ON_DEMAND' | 'OTHER';
  title: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

export interface RevenueStatsResponse {
  summary: FinancialSummary;
  recentTransactions: TransactionItem[];
}

export interface InstructorFinancialSummary {
  summary: {
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
  };
  instructors: {
    instructorId: string;
    name: string;
    email: string;
    totalEarned: number;
    paidAmount: number;
    pendingAmount: number;
    payoutCount: number;
  }[];
}

export interface PayoutItem {
  id: string;
  studioId: string;
  instructorId: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
  instructor: { id: string; name: string; email: string; phone?: string };
  session?: { id: string; title: string; startTime: string; status: string };
}

export interface StudioInfo {
  id: string;
  name: string;
  subdomain: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  identityNumber?: string | null;
}

export interface PackageDetail {
  id: string;
  studioId: string;
  name: string;
  type: string;
  creditCount: number;
  price: number;
  validityDays: number;
  allowedDisciplines: string[];
  allowedServices: string[];
  isOnlineSaleAllowed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPackageDetail {
  id: string;
  studioId: string;
  userId: string;
  packageId: string;
  creditsTotal: number;
  creditsUsed: number;
  pricePaid: number;
  expiresAt: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  package: PackageDetail;
}

export interface OrderItemDetail {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
}

export interface OrderDetail {
  id: string;
  studioId: string;
  userId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItemDetail[];
}

export interface DetailedPaymentResponse {
  id: string;
  studioId: string;
  userId: string;
  clientPackageId?: string | null;
  orderId?: string | null;
  amount: number;
  paymentMethod: 'CREDIT_CARD' | 'CASH' | 'EFT' | 'PAYTR' | string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED' | string;
  transactionId?: string | null;
  invoiceNo?: string | null;
  createdAt: string;
  user: UserInfo;
  clientPackage?: ClientPackageDetail | null;
  order?: OrderDetail | null;
  studio: StudioInfo;
}

export const financialsApi = {
  // 1. Ciro & Gelir Analitiği Getir
  getRevenueStats: async (params?: { startDate?: string; endDate?: string }): Promise<RevenueStatsResponse> => {
    const res = await api.get('/financials/revenue-stats', { params });
    return res.data?.data || res.data;
  },

  getPaymentById: async (id: string): Promise<DetailedPaymentResponse> => {
    const res = await api.get(`/financials/payments/${id}`);
    return res.data?.data || res.data;
  },

  // 2. Eğitmen Finansal Özeti Getir
  getInstructorSummary: async (instructorId?: string): Promise<InstructorFinancialSummary> => {
    const res = await api.get('/payouts/summary', { params: { instructorId } });
    return res.data?.data || res.data;
  },

  // 3. Eğitmen Hakediş Listesi
  getPayouts: async (params?: { instructorId?: string; isPaid?: boolean }): Promise<PayoutItem[]> => {
    const res = await api.get('/payouts', { params });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  // 4. Hakediş Oluştur
  createPayout: async (payload: { instructorId: string; sessionId?: string; amount: number }): Promise<PayoutItem> => {
    const res = await api.post('/payouts', payload);
    return res.data?.data || res.data;
  },

  // 5. Hakediş Ödemesini Tamamla
  markPayoutAsPaid: async (id: string): Promise<PayoutItem> => {
    const res = await api.patch(`/payouts/${id}/pay`);
    return res.data?.data || res.data;
  },

  // 6. Hakediş Sil
  deletePayout: async (id: string): Promise<void> => {
    await api.delete(`/payouts/${id}`);
  },
};