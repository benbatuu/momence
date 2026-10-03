'use client';

import React from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { RoleStats } from '@/components/dashboard/role.stats';
import { QuickActions } from '@/components/dashboard/quick.actions';
import { UpcomingClassesTable } from '@/components/dashboard/upcoming.classes.table';
import { RecentActivityFeed } from '@/components/dashboard/recent.activity.feed';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const role = user?.role || 'CLIENT';

    return (
        <div className="space-y-6 w-full">
            {/* Karşılama Başlığı */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Hoş Geldiniz, {user?.name || 'Kullanıcı'} 👋
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Stüdyo yönetim ve canlı operasyon durum özetiniz.
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>{role} Yetkisi</span>
                </div>
            </div>

            {/* 1. Hızlı Aksiyonlar */}
            <QuickActions role={role} />

            {/* 2. İstatistik Kartları */}
            <RoleStats role={role} />

            {/* 3. Canlı Dersler ve Aktivite Akışı */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <UpcomingClassesTable />
                </div>
                <div>
                    <RecentActivityFeed />
                </div>
            </div>
        </div>
    );
}