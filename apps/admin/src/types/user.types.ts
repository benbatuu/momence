import type { Role } from './auth.types';

export interface UserItem {
  id: string;
  studioId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilterParams {
  search?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}