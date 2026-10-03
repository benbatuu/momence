import { api } from './api';
import type { DisciplineType } from '@/types/studio.types';

export type PackageType = 'CREDIT_PACK' | 'UNLIMITED' | 'RECURRING_SUBSCRIPTION';

export interface PackageTemplate {
  id: string;
  studioId?: string;
  name: string;
  description?: string;
  type: PackageType;
  credits: number | null;
  price: number;
  currency?: string;
  validityDays: number;
  allowedDisciplines: (DisciplineType | string)[];
  allowedServices?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  type: PackageType;
  credits?: number | null;
  price: number;
  validityDays: number;
  allowedDisciplines: (DisciplineType | string)[];
  allowedServices?: string[];
}

export interface UpdatePackagePayload extends Partial<CreatePackagePayload> {
  isActive?: boolean;
}

export const packagesApi = {
  // Paket Şablonlarını Listele
  getPackages: async (params?: { search?: string; type?: string }): Promise<PackageTemplate[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.type && params.type !== 'ALL') queryParams.type = params.type;

    const res = await api.get('/packages', { params: queryParams });
    const data = res.data?.data?.packages || res.data?.packages || res.data?.data || res.data;

    return Array.isArray(data) ? data : [];
  },

  // Yeni Paket Şablonu Oluştur
  createPackage: async (payload: CreatePackagePayload): Promise<PackageTemplate> => {
    const res = await api.post('/packages', payload);
    return res.data?.data || res.data;
  },

  // Paket Şablonunu Güncelle
  updatePackage: async (id: string, payload: UpdatePackagePayload): Promise<PackageTemplate> => {
    const res = await api.patch(`/packages/${id}`, payload);
    return res.data?.data || res.data;
  },

  // Paket Durumunu Güncelle (Aktif / Pasif)
  togglePackageStatus: async (id: string, isActive: boolean): Promise<PackageTemplate> => {
    const res = await api.patch(`/packages/${id}`, { isActive });
    return res.data?.data || res.data;
  },

  // Paket Şablonunu Sil
  deletePackage: async (id: string): Promise<void> => {
    await api.delete(`/packages/${id}`);
  },
};