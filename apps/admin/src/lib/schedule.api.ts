import { api } from './api';

export interface ClassTemplateOption {
  id: string;
  title: string;
  discipline: string;
  durationMin: number;
  maxCapacity: number;
}

export interface InstructorOption {
  id: string;
  name: string;
  email: string;
}

export interface BookingParticipant {
  id: string; // Booking ID
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED_EARLY' | 'CANCELLED_LATE';
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  attendance?: {
    status: 'ATTENDED' | 'NO_SHOW';
    notes?: string;
  };
}

export interface ClassSessionDetail {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  lateCancelHours: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  instructor?: {
    id: string;
    name: string;
  };
  template?: {
    discipline: string;
  };
  bookings: BookingParticipant[];
  _count?: {
    bookings: number;
  };
}

export interface CreateSessionPayload {
  templateId?: string;
  instructorId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  lateCancelHours?: number;
}

export const scheduleApi = {
  // Takvim Seanslarını Getir (Tarih Aralığına Göre)
  getSessions: async (startDateStr: string, endDateStr: string): Promise<ClassSessionDetail[]> => {
    // Başlangıç Gününün Başı: 00:00:00.000Z
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    // Bitiş Gününün Sonu: 23:59:59.999Z
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const res = await api.get('/classes/calendar', {
      params: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });

    return res.data?.data || [];
  },

  // Tekil Seans Detayı ve Katılımcı Listesi
  getSessionById: async (sessionId: string): Promise<ClassSessionDetail> => {
    const res = await api.get(`/classes/sessions/${sessionId}`);
    return res.data?.data;
  },

  // Ders Şablonlarını Listele (Modal içi seçim için)
  getTemplates: async (): Promise<ClassTemplateOption[]> => {
    const res = await api.get('/classes/templates');
    return res.data?.data || [];
  },

  // Eğitmenleri Listele
  getInstructors: async (): Promise<InstructorOption[]> => {
    const res = await api.get('/users', { params: { role: 'INSTRUCTOR' } });
    
    // Backend yanıt yapısına göre array ayrıştırma
    const rawData = res.data?.data;
    
    if (Array.isArray(rawData)) {
      return rawData;
    }
    
    if (rawData && Array.isArray(rawData.users)) {
      return rawData.users;
    }

    if (Array.isArray(res.data?.users)) {
      return res.data.users;
    }

    return [];
  },

  // Yeni Seans Oluştur
  createSession: async (payload: CreateSessionPayload): Promise<ClassSessionDetail> => {
    const res = await api.post('/classes/sessions', payload);
    return res.data?.data;
  },

  // Seansı İptal Et
  cancelSession: async (sessionId: string, reason?: string): Promise<void> => {
    await api.patch(`/classes/sessions/${sessionId}/cancel`, { reason });
  },

  // Derse Rezervasyon Yap
  bookSession: async (sessionId: string): Promise<void> => {
    await api.post('/bookings', { sessionId });
  },

  // Yoklama Gir / Güncelle
  recordAttendance: async (bookingId: string, status: 'ATTENDED' | 'NO_SHOW', notes?: string): Promise<void> => {
    await api.post('/bookings/attendance', { bookingId, status, notes });
  },
};