import type { DisciplineType } from './studio.types';

export type VideoCategory = 'SERIES' | 'SINGLE_CLASS' | 'TUTORIAL' | 'WORKOUT_PLAN';

export interface OnDemandVideo {
  id: string;
  studioId: string;
  title: string;
  description?: string | null;
  category: VideoCategory;
  discipline: DisciplineType;
  durationMinutes: number;
  videoUrl: string;
  thumbnailUrl?: string | null;
  instructorName: string;
  isMembersOnly: boolean; // Sadece aktif paket sahibi olanlar mı erişebilir?
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOnDemandInput {
  title: string;
  description?: string;
  category: VideoCategory;
  discipline: DisciplineType;
  durationMinutes: number;
  videoUrl: string;
  thumbnailUrl?: string;
  instructorName: string;
  isMembersOnly: boolean;
}