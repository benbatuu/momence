'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from './stat.card';
import { useLanguageStore } from '@/lib/language.store';
import type { Role } from '@/types';
import { dashboardApi, DashboardStatsData } from '@/lib/dashboard.api';
import { Users, PackageCheck, CalendarCheck, Banknote, Sparkles, Dumbbell, Building, Loader2 } from 'lucide-react';

interface RoleStatsProps {
    role: Role;
}

export function RoleStats({ role }: RoleStatsProps) {
    const t = useLanguageStore((state) => state.t());
    const [stats, setStats] = useState<DashboardStatsData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                const data = await dashboardApi.getStats(role);
                if (isMounted) {
                    setStats(data);
                }
            } catch {
                if (isMounted) {
                    setStats(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, [role]);

    if (isLoading) {
        return (
            <div className="p-8 bg-card border border-border rounded-xl text-center text-muted-foreground flex items-center justify-center gap-2 shadow-xs">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> İstatistikler yükleniyor...
            </div>
        );
    }

    if (role === 'SUPER_ADMIN') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Toplam Stüdyolar" value={stats?.totalStudiosCount || 0} description="Platforma kayıtlı" icon={Building} />
                <StatCard title="Aktif Stüdyolar" value={stats?.activeStudiosCount || 0} description="Hizmet veren" icon={Sparkles} />
                <StatCard title="Toplam Üyeler" value={stats?.totalMembers || 0} description="Tüm stüdyolar" icon={Users} />
                <StatCard
                    title="Platform Toplam Ciro"
                    value={`₺${(stats?.platformTotalRevenue || 0).toLocaleString('tr-TR')}`}
                    trend="Canlı"
                    description="SaaS Genel"
                    icon={Banknote}
                />
            </div>
        );
    }

    if (role === 'ADMIN') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t.dashboard.totalMembers} value={stats?.totalMembers || 0} description="Kayıtlı müşteri" icon={Users} />
                <StatCard title={t.dashboard.activePackages} value={stats?.activePackages || 0} description="Aktif paket tipi" icon={PackageCheck} />
                <StatCard title={t.dashboard.todayClasses} value={stats?.todayClassesCount || 0} description={`${stats?.completedTodayClassesCount || 0} tanesi tamamlandı`} icon={CalendarCheck} />
                <StatCard title={t.dashboard.monthlyRevenue} value={`₺${(stats?.monthlyRevenue || 0).toLocaleString('tr-TR')}`} trend="Bu Ay" description="Toplam ciro" icon={Banknote} />
            </div>
        );
    }

    if (role === 'INSTRUCTOR') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title={t.dashboard.todayClasses} value={`${stats?.instructorTodayClasses || 0} Ders`} description={`İlk ders: ${stats?.instructorFirstClassTime}`} icon={CalendarCheck} />
                <StatCard title={t.navigation.items.myClients} value={`${stats?.totalClientsCount || 0} Danışan`} description="Aktif takipte" icon={Users} />
                <StatCard title="Haftalık Ders Saati" value={`${stats?.weeklyTotalHours || 0} Saat`} description="Bu hafta" icon={Dumbbell} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title={t.dashboard.myActivePackage} value={stats?.activePackageName || 'Üyelik Yok'} description={`Son Gün: ${stats?.packageExpiryDate || '-'}`} icon={Sparkles} />
            <StatCard title={t.dashboard.remainingCredits} value={`${stats?.remainingCredits || 0} / ${stats?.totalCredits || 0} Hak`} description="Kalan hak" icon={PackageCheck} />
            <StatCard title={t.dashboard.nextClass} value={stats?.nextClassTitle || 'Yok'} description={`${stats?.nextClassTime} - ${stats?.nextClassInstructor}`} icon={CalendarCheck} />
        </div>
    );
}