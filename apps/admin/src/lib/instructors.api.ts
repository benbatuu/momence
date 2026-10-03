/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from './api';
import type { DisciplineType } from '@/types/studio.types';

export interface InstructorUserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'INSTRUCTOR' | string;
  isActive: boolean;
  createdAt?: string;
}

export interface InstructorProfile {
  id: string;
  userId: string;
  user?: InstructorUserInfo;
  specialties: (DisciplineType | string)[];
  bio?: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  stats?: {
    monthlyEarnings?: number;
    totalSessionsCount?: number;
  };
  recentSessions?: {
    id: string;
    title: string;
    date: string;
    time: string;
    participantCount: number;
    earnings: number;
  }[];
}

export interface CreateInstructorPayload {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  specialties: (DisciplineType | string)[];
  hourlyRate: number;
  password?: string;
}

export interface UpdateInstructorPayload {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  specialties?: (DisciplineType | string)[];
  hourlyRate?: number;
  isActive?: boolean;
}

export const instructorsApi = {
  // /users endpoint'inden rolü INSTRUCTOR olan kullanıcıları çek
  getInstructors: async (params?: { search?: string; specialty?: string }): Promise<InstructorProfile[]> => {
    const queryParams: Record<string, string> = { role: 'INSTRUCTOR' };
    if (params?.search) queryParams.search = params.search;

    const res = await api.get('/users', { params: queryParams });
    const rawUsers = res.data?.data?.users || res.data?.users || res.data?.data || res.data || [];

    if (!Array.isArray(rawUsers)) return [];

    return rawUsers.map((u: any) => ({
      id: u.id,
      userId: u.id,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt,
      },
      specialties: u.specialties || ['PILATES', 'YOGA'],
      bio: u.bio || 'Stüdyo Uzman Eğitmeni',
      hourlyRate: u.hourlyRate || 500,
      isActive: u.isActive ?? true,
      createdAt: u.createdAt || new Date().toISOString(),
    }));
  },

  // /users/:id uç noktasından tekil eğitmen bilgisini çek
  getInstructorById: async (id: string): Promise<InstructorProfile> => {
    const res = await api.get(`/users/${id}`);
    const u = res.data?.data || res.data;

    return {
      id: u.id,
      userId: u.id,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt,
      },
      specialties: u.specialties || ['PILATES', 'YOGA'],
      bio: u.bio || 'Stüdyo Uzman Eğitmeni',
      hourlyRate: u.hourlyRate || 500,
      isActive: u.isActive ?? true,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  },

  // /users endpoint'ine role: 'INSTRUCTOR' ile yeni kullanıcı kaydet
  createInstructor: async (payload: CreateInstructorPayload): Promise<InstructorProfile> => {
    const res = await api.post('/users', {
      ...payload,
      role: 'INSTRUCTOR',
      password: payload.password || 'Password123!',
    });
    const u = res.data?.data || res.data;

    return {
      id: u.id,
      userId: u.id,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive ?? true,
      },
      specialties: payload.specialties,
      bio: payload.bio,
      hourlyRate: payload.hourlyRate,
      isActive: true,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  },

  // /users/:id üzerinden güncelle
  updateInstructor: async (id: string, payload: UpdateInstructorPayload): Promise<void> => {
    await api.patch(`/users/${id}`, payload);
  },

  // /users/:id üzerinden sil
  deleteInstructor: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};