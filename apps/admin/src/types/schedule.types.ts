import type { ClassDefinition } from './class.types';
import type { UserItem } from './user.types';

export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ClassSession {
  id: string;
  studioId: string;
  classDefinitionId: string;
  classDefinition?: ClassDefinition;
  instructorId: string;
  instructor?: UserItem;
  roomName: string; // örn: "Reformer Salonu 1", "Yoga Mat Stüdyosu"
  startTime: string; // ISO Date String
  endTime: string; // ISO Date String
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  classDefinitionId: string;
  instructorId: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  capacity: number;
}