import { api } from './api';
import type { Role } from '@/types';

export interface UserPackageInfo {
  id: string;
  packageName: string;
  remainingCredits: number;
  totalCredits: number;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
}

export interface UserAttendanceHistory {
  id: string;
  sessionTitle: string;
  date: string;
  status: 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
  instructorName: string;
}

export interface UserPaymentHistory {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  date: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
}

export interface UserDetailItem {
  id: string;
  studioId?: string;
  studioName?: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  avatarUrl?: string;
  notes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  packages?: UserPackageInfo[];
  attendances?: UserAttendanceHistory[];
  payments?: UserPaymentHistory[];
  stats?: {
    totalSpent: number;
    totalAttended: number;
    noShowCount: number;
    activePackagesCount: number;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: Role;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  isActive?: boolean;
  notes?: string;
}

export const usersApi = {
  // Kullanıcıları Listele
  getUsers: async (params?: { search?: string; role?: string }): Promise<UserDetailItem[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.role && params.role !== 'ALL') queryParams.role = params.role;

    const res = await api.get('/users', { params: queryParams });
    const data = res.data?.data?.users || res.data?.users || res.data?.data || res.data;

    return Array.isArray(data) ? data : [];
  },

  // Kullanıcı Detayını Getir (Super Admin İncelemesi İçin)
  getUserById: async (id: string): Promise<UserDetailItem> => {
    const res = await api.get(`/users/${id}`);
    return res.data?.data || res.data;
  },

  // Yeni Kullanıcı Oluştur
  createUser: async (payload: CreateUserPayload): Promise<UserDetailItem> => {
    const res = await api.post('/users', payload);
    return res.data?.data || res.data;
  },

  // Kullanıcı Güncelle
  updateUser: async (id: string, payload: UpdateUserPayload): Promise<UserDetailItem> => {
    const res = await api.patch(`/users/${id}`, payload);
    return res.data?.data || res.data;
  },

  // Kullanıcı Durumunu Güncelle (Aktif / Pasif)
  toggleUserStatus: async (id: string, isActive: boolean): Promise<UserDetailItem> => {
    const res = await api.patch(`/users/${id}`, { isActive });
    return res.data?.data || res.data;
  },

  // Kullanıcı Sil
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};