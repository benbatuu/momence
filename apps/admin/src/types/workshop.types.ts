import type { DisciplineType, ServiceType } from './studio.types';
import type { UserItem } from './user.types';

export type EventType = 'WORKSHOP' | 'MASTERCLASS' | 'RETREAT' | 'CERTIFICATION';

export interface WorkshopItem {
  id: string;
  studioId: string;
  title: string;
  description?: string | null;
  eventType: EventType;
  discipline: DisciplineType;
  serviceType: ServiceType; // WORKSHOP or RETREAT
  instructorId: string;
  instructor?: UserItem;
  roomName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  currency: string;
  capacity: number;
  bookedCount: number;
  isOnline: boolean;
  meetingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkshopInput {
  title: string;
  description?: string;
  eventType: EventType;
  discipline: DisciplineType;
  instructorId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  price: number;
  capacity: number;
  isOnline: boolean;
}