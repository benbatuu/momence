export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyGrowthRate: number;
  packagesRevenue: number;
  appointmentsRevenue: number;
  workshopsRevenue: number;
  storeRevenue: number;
}

export interface AttendanceAnalytics {
  totalBookings: number;
  averageOccupancyRate: number; // örn: %82
  completedClasses: number;
  cancellationRate: number;
}

export interface TopClassStat {
  className: string;
  discipline: string;
  totalAttendees: number;
  revenueGenerated: number;
}

export interface StudioReportsOverview {
  revenue: RevenueAnalytics;
  attendance: AttendanceAnalytics;
  topClasses: TopClassStat[];
}