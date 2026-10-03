'use client';

import React, { useEffect, useState } from 'react';
import { dashboardApi, RecentActivityItem } from '@/lib/dashboard.api';
import { Activity, Clock, User, Loader2 } from 'lucide-react';

export function RecentActivityFeed() {
    const [activities, setActivities] = useState<RecentActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        dashboardApi.getRecentActivities()
            .then(setActivities)
            .catch(() => setActivities([]))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Son Sistem Hareketleri
                </h3>
            </div>

            {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-primary" />
                    Yükleniyor...
                </div>
            ) : activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                    Henüz bir aktivite kaydı bulunmuyor.
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((act) => (
                        <div key={act.id} className="flex items-start justify-between p-2.5 rounded-lg bg-input/50 border border-border/50 text-xs">
                            <div className="space-y-0.5">
                                <div className="font-mono font-bold text-foreground">{act.action}</div>
                                <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                    <User className="w-3 h-3 text-muted-foreground" /> {act.actorName}
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {act.createdAt}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}