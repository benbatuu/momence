import { api } from './api';
import type { Role } from '@/types';

// --- API Yanıt Tipleri ---
export interface CalendarSessionResponse {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  instructor?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  _count?: {
    bookings: number;
  };
}

export interface FinancialReportResponse {
  summary: {
    totalRevenue: number;
    packageRevenue: number;
    storeRevenue: number;
    totalInstructorCosts: number;
    netProfitMargin: number;
  };
}

export interface AuditLogResponseItem {
  id: string;
  action: string;
  category: string;
  createdAt: string;
  actor?: {
    name: string;
  };
}

// --- Dashboard Component Tipleri ---
export interface DashboardStatsData {
  // ADMIN & SUPER_ADMIN Metrikleri
  totalMembers?: number;
  activePackages?: number;
  todayClassesCount?: number;
  completedTodayClassesCount?: number;
  monthlyRevenue?: number;

  // INSTRUCTOR Metrikleri
  instructorTodayClasses?: number;
  instructorFirstClassTime?: string;
  totalClientsCount?: number;
  weeklyTotalHours?: number;

  // CLIENT Metrikleri
  activePackageName?: string;
  packageExpiryDate?: string;
  remainingCredits?: number;
  totalCredits?: number;
  nextClassTitle?: string;
  nextClassTime?: string;
  nextClassInstructor?: string;

  // SUPER_ADMIN Özel Metrikleri
  totalStudiosCount?: number;
  activeStudiosCount?: number;
  platformTotalRevenue?: number;
}

export interface UpcomingClassSession {
  id: string;
  title: string;
  instructorName: string;
  startTime: string;
  bookedCount: number;
  capacity: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  isFull: boolean;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  actorName: string;
  category: string;
  createdAt: string;
}

export const dashboardApi = {
  /**
   * Kullanıcının rolüne özel Dashboard İstatistiklerini Döner (Fully Typed)
   */
  getStats: async (role: Role): Promise<DashboardStatsData> => {
    if (role === 'SUPER_ADMIN') {
      const res = await api.get('/super-admin/studios/metrics');
      const data = res.data.data;
      return {
        totalStudiosCount: data.totalStudios,
        activeStudiosCount: data.activeStudios,
        totalMembers: data.totalUsers,
        platformTotalRevenue: data.totalRevenue,
      };
    }

    if (role === 'ADMIN') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const [usersRes, packagesRes, calendarRes, reportRes] = await Promise.all([
        api.get('/users?limit=1').catch(() => null),
        api.get('/packages').catch(() => null),
        api.get<{ data: CalendarSessionResponse[] }>(`/classes/calendar?startDate=${todayStr}&endDate=${todayStr}`).catch(() => null),
        api.get<{ data: FinancialReportResponse }>(`/reports/financial?startDate=${startOfMonth}&endDate=${endOfMonth}`).catch(() => null),
      ]);

      const todaySessions: CalendarSessionResponse[] = calendarRes?.data?.data || [];
      const completedSessions = todaySessions.filter((s) => s.status === 'COMPLETED').length;

      return {
        totalMembers: usersRes?.data?.pagination?.total || 0,
        activePackages: packagesRes?.data?.data?.length || 0,
        todayClassesCount: todaySessions.length,
        completedTodayClassesCount: completedSessions,
        monthlyRevenue: reportRes?.data?.data?.summary?.totalRevenue || 0,
      };
    }

    if (role === 'INSTRUCTOR') {
      const todayStr = new Date().toISOString().split('T')[0];
      const calendarRes = await api.get<{ data: CalendarSessionResponse[] }>(`/classes/calendar?startDate=${todayStr}&endDate=${todayStr}`).catch(() => null);
      const sessions: CalendarSessionResponse[] = calendarRes?.data?.data || [];

      const firstSessionTime = sessions[0]?.startTime
        ? new Date(sessions[0].startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : 'Ders Yok';

      return {
        instructorTodayClasses: sessions.length,
        instructorFirstClassTime: firstSessionTime,
        totalClientsCount: 0,
        weeklyTotalHours: sessions.length * 1,
      };
    }

    // CLIENT
    const todayStr = new Date().toISOString().split('T')[0];
    const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const myBookingsRes = await api.get<{ data: CalendarSessionResponse[] }>(`/classes/calendar?startDate=${todayStr}&endDate=${nextWeekStr}`).catch(() => null);
    const sessions: CalendarSessionResponse[] = myBookingsRes?.data?.data || [];

    return {
      activePackageName: 'Aktif Üyelik',
      remainingCredits: 8,
      totalCredits: 10,
      nextClassTitle: sessions[0]?.title || 'Yaklaşan Ders Yok',
      nextClassTime: sessions[0]?.startTime
        ? new Date(sessions[0].startTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
        : '-',
      nextClassInstructor: sessions[0]?.instructor?.name || '-',
    };
  },

  /**
   * Yaklaşan Canlı Ders Seanslarını Döner
   */
  getUpcomingClasses: async (): Promise<UpcomingClassSession[]> => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await api.get<{ data: CalendarSessionResponse[] }>(`/classes/calendar?startDate=${today}&endDate=${nextWeek}`);
    const rawSessions: CalendarSessionResponse[] = res.data?.data || [];

    return rawSessions.slice(0, 5).map((s) => {
      const bookedCount = s._count?.bookings || 0;
      return {
        id: s.id,
        title: s.title,
        instructorName: s.instructor?.name || 'Belirtilmedi',
        startTime: new Date(s.startTime).toLocaleString('tr-TR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        bookedCount,
        capacity: s.capacity,
        status: s.status,
        isFull: bookedCount >= s.capacity,
      };
    });
  },

  /**
   * Son Sistem / Audit Aktivite Akışını Döner
   */
  getRecentActivities: async (): Promise<RecentActivityItem[]> => {
    const res = await api.get('/auditlogs?limit=6').catch(() => null);
    const logs: AuditLogResponseItem[] = res?.data?.data?.logs || [];

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      actorName: log.actor?.name || 'Sistem',
      category: log.category,
      createdAt: new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    }));
  },
};