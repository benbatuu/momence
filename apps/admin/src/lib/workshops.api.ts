import { api } from './api';

export interface WorkshopInstructorOption {
  id: string;
  name: string;
  email: string;
}

export interface WorkshopItem {
  id: string;
  studioId: string;
  title: string;
  description?: string;
  eventType: 'WORKSHOP' | 'MASTERCLASS' | 'RETREAT' | 'CERTIFICATION';
  discipline: 'YOGA' | 'PILATES' | 'DANCE' | 'WELLNESS_SPA' | string;
  instructorId?: string;
  instructor?: WorkshopInstructorOption;
  roomName?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  price: number;
  currency?: string;
  capacity: number;
  bookedCount?: number;
  isOnline?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWorkshopPayload {
  title: string;
  description?: string;
  eventType: 'WORKSHOP' | 'MASTERCLASS' | 'RETREAT' | 'CERTIFICATION';
  discipline: 'YOGA' | 'PILATES' | 'DANCE' | 'WELLNESS_SPA' | string;
  instructorId: string;
  roomName?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  price: number;
  capacity: number;
  isOnline?: boolean;
}

export const workshopsApi = {
  // Atölyeleri Listele
  getWorkshops: async (params?: { search?: string; eventType?: string }): Promise<WorkshopItem[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.eventType && params.eventType !== 'ALL') queryParams.eventType = params.eventType;

    const res = await api.get('/workshops', { params: queryParams });
    const data = res.data?.data?.workshops || res.data?.workshops || res.data?.data || res.data;
    
    return Array.isArray(data) ? data : [];
  },

  // Yeni Atölye/Etkinlik Oluştur
  createWorkshop: async (payload: CreateWorkshopPayload): Promise<WorkshopItem> => {
    const res = await api.post('/workshops', payload);
    return res.data?.data || res.data;
  },

  // Atölye Sil
  deleteWorkshop: async (id: string): Promise<void> => {
    await api.delete(`/workshops/${id}`);
  },

  // Eğitmen Listesini Getir (Modal Seçimi İçin)
  getInstructors: async (): Promise<WorkshopInstructorOption[]> => {
    const res = await api.get('/users', { params: { role: 'INSTRUCTOR' } });
    const data = res.data?.data || res.data?.users || [];
    return Array.isArray(data) ? data : [];
  },
};