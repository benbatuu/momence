import { api } from './api';

export interface StudioListItem {
  id: string;
  name: string;
  subdomain: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    classSessions: number;
    clientPackages: number;
    payments: number;
  };
}

export interface PlatformMetrics {
  totalStudios: number;
  activeStudios: number;
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
}

export interface CreateStudioPayload {
  name: string;
  subdomain: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  currency?: string;
  paytrMerchantId?: string;
  paytrSecretKey?: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
}

export const studioApi = {
  // SaaS Platform Metriklerini Getir
  getMetrics: async (): Promise<PlatformMetrics> => {
    const res = await api.get('/super-admin/studios/metrics');
    return res.data.data;
  },

  // Stüdyoları Listele
  getStudios: async (search?: string, isActive?: boolean): Promise<StudioListItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (typeof isActive === 'boolean') params.isActive = String(isActive);

    const res = await api.get('/super-admin/studios', { params });
    return res.data.data;
  },

  // Yeni Stüdyo ve Admin Hesabı Oluştur
  createStudio: async (data: CreateStudioPayload): Promise<unknown> => {
    const res = await api.post('/super-admin/studios', data);
    return res.data.data;
  },

  // Stüdyo Durumunu Değiştir (Aktif/Pasif)
  toggleStudioStatus: async (studioId: string, isActive: boolean): Promise<unknown> => {
    const res = await api.patch(`/super-admin/studios/${studioId}/status`, { isActive });
    return res.data.data;
  },
};