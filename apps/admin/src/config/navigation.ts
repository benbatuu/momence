import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  CalendarDays,
  Sparkles,
  Ticket,
  CreditCard,
  BarChart3,
  Dumbbell,
  Building2,
  Settings,
  BookmarkCheck,
  Video,
  Award,
  Store,
  ShieldCheck,
  Building,
} from 'lucide-react';
import type { Role } from '@/types';
import type { DisciplineType, ServiceType } from '@/types/studio.types';

export interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  requiredDisciplines?: DisciplineType[];
  requiredServices?: ServiceType[];
  badge?: string;
}

export interface NavGroup {
  groupTitleKey: string;
  items: NavItem[];
}

export const MOMENCE_NAVIGATION: NavGroup[] = [
  // ==========================================
  // 1. SAAS SUPER ADMIN PLATFORM YÖNETİMİ
  // ==========================================
  {
    groupTitleKey: 'navigation.groups.saasAdmin',
    items: [
      {
        titleKey: 'navigation.items.studios',
        href: '/dashboard/studios',
        icon: Building,
        roles: ['SUPER_ADMIN'],
      },
      {
        titleKey: 'navigation.items.auditLogs',
        href: '/dashboard/audit-logs',
        icon: ShieldCheck,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // ==========================================
  // 2. GENEL DASHBOARD
  // ==========================================
  {
    groupTitleKey: 'navigation.groups.general',
    items: [
      {
        titleKey: 'navigation.items.dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT'],
      },
    ],
  },

  // ==========================================
  // 3. TAKVİM VE DERS YÖNETİMİ
  // ==========================================
  {
    groupTitleKey: 'navigation.groups.scheduleAndClasses',
    items: [
      {
        titleKey: 'navigation.items.liveSchedule',
        href: '/dashboard/schedule',
        icon: CalendarDays,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT'],
      },
      {
        titleKey: 'navigation.items.classes',
        href: '/dashboard/classes',
        icon: Calendar,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        requiredServices: ['CLASS'],
      },
      {
        titleKey: 'navigation.items.appointments',
        href: '/dashboard/appointments',
        icon: Dumbbell,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        requiredServices: ['APPOINTMENT'],
      },
      {
        titleKey: 'navigation.items.workshopsAndEvents',
        href: '/dashboard/workshops',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT'],
        requiredServices: ['WORKSHOP', 'RETREAT'],
      },
      {
        titleKey: 'navigation.items.myBookings',
        href: '/dashboard/my-bookings',
        icon: BookmarkCheck,
        roles: ['CLIENT'],
      },
    ],
  },

  // ==========================================
  // 4. KULLANICI VE PERSONEL YÖNETİMİ
  // ==========================================
  {
    groupTitleKey: 'navigation.groups.userManagement',
    items: [
      {
        titleKey: 'navigation.items.customers',
        href: '/dashboard/users',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        titleKey: 'navigation.items.myClients',
        href: '/dashboard/users',
        icon: UserCheck,
        roles: ['INSTRUCTOR'],
      },
      {
        titleKey: 'navigation.items.teachers',
        href: '/dashboard/instructors',
        icon: Award,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },

  // ==========================================
  // 5. SATIŞ, MAĞAZA VE ÜYELİKLER
  // ==========================================
  {
    groupTitleKey: 'navigation.groups.salesAndMemberships',
    items: [
      {
        titleKey: 'navigation.items.membershipPacks',
        href: '/dashboard/packages',
        icon: Ticket,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        titleKey: 'navigation.items.onDemandVideo',
        href: '/dashboard/on-demand',
        icon: Video,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT'],
      },
      {
        titleKey: 'navigation.items.posStore',
        href: '/dashboard/store',
        icon: Store,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        titleKey: 'navigation.items.payments',
        href: '/dashboard/payments',
        icon: CreditCard,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },

  // ==========================================
  // 6. STÜDYO YÖNETİMİ VE AYARLAR
  // ==========================================
  {
    groupTitleKey: 'navigation.groups.studioAdmin',
    items: [
      {
        titleKey: 'navigation.items.analytics',
        href: '/dashboard/reports',
        icon: BarChart3,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        titleKey: 'navigation.items.studioProfile',
        href: '/dashboard/studio-settings',
        icon: Building2,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        titleKey: 'navigation.items.settings',
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT'],
      },
    ],
  },
];