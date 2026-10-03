import { api } from './api';
import type { ClassLevel } from '@/types/class.types';

export type DisciplineType = 'REFORMER' | 'PILATES' | 'YOGA' | 'DANCE' | 'FITNESS_GYM' | 'WELLNESS_SPA';

export interface ClassStudioInfo {
  id: string;
  name: string;
  subdomain: string;
}

export interface ClassDefinitionItem {
  id: string;
  studioId: string;
  title: string;
  description?: string;
  discipline: DisciplineType | string;
  durationMin: number;
  maxCapacity: number;
  level: ClassLevel | string;
  colorHex?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  studio?: ClassStudioInfo;
  _count?: {
    sessions: number;
  };
}

export interface CreateClassPayload {
  title: string;
  description?: string;
  discipline: DisciplineType | string;
  durationMin: number;
  maxCapacity: number;
  level: ClassLevel | string;
  colorHex?: string;
}

export interface UpdateClassPayload extends Partial<CreateClassPayload> {
  isActive?: boolean;
}

export const classesApi = {
  // Tüm ders şablonlarını listele
  getClasses: async (params?: { discipline?: string; search?: string }): Promise<ClassDefinitionItem[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.discipline && params.discipline !== 'ALL') queryParams.discipline = params.discipline;
    if (params?.search) queryParams.search = params.search;

    const res = await api.get('/classes/templates', { params: queryParams });
    const data = res.data?.data;
    
    return Array.isArray(data) ? data : [];
  },

  // Tekil Ders Şablonu Detayı
  getClassById: async (id: string): Promise<ClassDefinitionItem> => {
    const res = await api.get(`/classes/templates/${id}`);
    return res.data?.data || res.data;
  },

  // Yeni Ders Şablonu Oluştur
  createClass: async (payload: CreateClassPayload): Promise<ClassDefinitionItem> => {
    const res = await api.post('/classes/templates', payload);
    return res.data?.data || res.data;
  },

  // Ders Şablonunu Güncelle
  updateClass: async (id: string, payload: UpdateClassPayload): Promise<ClassDefinitionItem> => {
    const res = await api.patch(`/classes/templates/${id}`, payload);
    return res.data?.data || res.data;
  },

  // Ders Şablonunu Sil
  deleteClass: async (id: string): Promise<void> => {
    await api.delete(`/classes/templates/${id}`);
  },
};