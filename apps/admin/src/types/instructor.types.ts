import type { DisciplineType } from './studio.types';
import type { UserItem } from './user.types';

export interface InstructorProfile {
  id: string;
  userId: string;
  user?: UserItem;
  bio?: string | null;
  specialties: DisciplineType[];
  hourlyRate?: number | null;
  currency?: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstructorInput {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  specialties: DisciplineType[];
  hourlyRate?: number;
}