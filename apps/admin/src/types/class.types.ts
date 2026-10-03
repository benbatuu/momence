import type { DisciplineType, ServiceType } from './studio.types';

export type ClassLevel = 'ALL_LEVELS' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ClassDefinition {
  id: string;
  studioId: string;
  title: string;
  description?: string | null;
  discipline: DisciplineType;
  serviceType: ServiceType;
  durationMinutes: number; // örn: 50 dakika
  capacity: number; // varsayılan sınıf kapasitesi
  level: ClassLevel;
  colorHex?: string; // Takvimde görünecek renk kodu
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  title: string;
  description?: string;
  discipline: DisciplineType;
  serviceType: ServiceType;
  durationMinutes: number;
  capacity: number;
  level: ClassLevel;
  colorHex?: string;
}