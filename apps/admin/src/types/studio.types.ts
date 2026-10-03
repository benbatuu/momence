export type DisciplineType =
  | 'PILATES'
  | 'YOGA'
  | 'DANCE'
  | 'FITNESS_GYM'
  | 'MARTIAL_ARTS'
  | 'WELLNESS_SPA';

export type ServiceType =
  | 'CLASS'
  | 'APPOINTMENT'
  | 'WORKSHOP'
  | 'COURSE'
  | 'RETREAT';

export interface StudioConfig {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timeZone: string;
  address: string;
  disciplines: DisciplineType[];
  enabledServices: ServiceType[];
}