import { api } from './api';

export interface AppointmentUserOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface AppointmentItem {
  id: string;
  studioId: string;
  title: string;
  notes?: string;
  roomName?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  price: number;
  currency?: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  client?: AppointmentUserOption;
  instructor?: AppointmentUserOption;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAppointmentPayload {
  title: string;
  clientId: string;
  instructorId: string;
  roomName?: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  notes?: string;
}

export const appointmentsApi = {
  // Randevuları Listele
  getAppointments: async (params?: { search?: string; status?: string }): Promise<AppointmentItem[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

    const res = await api.get('/appointments', { params: queryParams });
    const data = res.data?.data?.appointments || res.data?.appointments || res.data?.data || res.data;
    
    return Array.isArray(data) ? data : [];
  },

  // Yeni Özel Randevu Oluştur
  createAppointment: async (payload: CreateAppointmentPayload): Promise<AppointmentItem> => {
    const res = await api.post('/appointments', payload);
    return res.data?.data || res.data;
  },

  // Randevu Durumunu Güncelle (Onayla / Tamamla / İptal Et)
  updateAppointmentStatus: async (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'): Promise<AppointmentItem> => {
    const res = await api.patch(`/appointments/${id}/status`, { status });
    return res.data?.data || res.data;
  },

  // Randevuyu Sil
  deleteAppointment: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  // Danışan (Client) Listesini Getir (Modal Seçimi İçin)
  getClients: async (): Promise<AppointmentUserOption[]> => {
    const res = await api.get('/users', { params: { role: 'CLIENT' } });
    const data = res.data?.data || res.data?.users || [];
    return Array.isArray(data) ? data : [];
  },

  // Eğitmen Listesini Getir (Modal Seçimi İçin)
  getInstructors: async (): Promise<AppointmentUserOption[]> => {
    const res = await api.get('/users', { params: { role: 'INSTRUCTOR' } });
    const data = res.data?.data || res.data?.users || [];
    return Array.isArray(data) ? data : [];
  },
};