import type { DisciplineType, ServiceType } from './studio.types';

export type PackageType = 'CREDIT_PACK' | 'UNLIMITED' | 'RECURRING_SUBSCRIPTION';

export interface PackageTemplate {
  id: string;
  studioId: string;
  name: string;
  description?: string | null;
  type: PackageType;
  credits?: number | null; // Kreditli paketler için toplam ders sayısı
  price: number;
  currency: string;
  validityDays: number; // Paketin geçerlilik süresi (ör: 30 gün)
  allowedDisciplines: DisciplineType[];
  allowedServices: ServiceType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageInput {
  name: string;
  description?: string;
  type: PackageType;
  credits?: number;
  price: number;
  validityDays: number;
  allowedDisciplines: DisciplineType[];
  allowedServices: ServiceType[];
}