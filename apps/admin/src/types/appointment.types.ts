import type { ServiceType } from './studio.types';
import type { UserItem } from './user.types';

export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentItem {
  id: string;
  studioId: string;
  title: string;
  clientId: string;
  client?: UserItem;
  instructorId: string;
  instructor?: UserItem;
  serviceType: ServiceType; // APPOINTMENT
  roomName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  currency: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  title: string;
  clientId: string;
  instructorId: string;
  roomName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  notes?: string;
}