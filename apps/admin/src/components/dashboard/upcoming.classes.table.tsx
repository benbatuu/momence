'use client';

import React, { useEffect, useState } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { dashboardApi, UpcomingClassSession } from '@/lib/dashboard.api';
import { Calendar, Users, Clock, Loader2 } from 'lucide-react';

export function UpcomingClassesTable() {
    const t = useLanguageStore((state) => state.t());
    const [classes, setClasses] = useState<UpcomingClassSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        dashboardApi.getUpcomingClasses()
            .then(setClasses)
            .catch(() => setClasses([]))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t.dashboard.upcomingClasses}
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-foreground">
                    <thead className="bg-input text-muted-foreground font-semibold uppercase border-b border-border">
                        <tr>
                            <th className="p-3">Ders Adı</th>
                            <th className="p-3">{t.dashboard.instructor}</th>
                            <th className="p-3">{t.dashboard.date}</th>
                            <th className="p-3">{t.dashboard.capacity}</th>
                            <th className="p-3 text-right">{t.dashboard.status}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-primary" />
                                    Dersler yükleniyor...
                                </td>
                            </tr>
                        ) : classes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                    Yaklaşan canlı ders bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            classes.map((c) => (
                                <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                                    <td className="p-3 font-semibold text-foreground">{c.title}</td>
                                    <td className="p-3 text-muted-foreground">{c.instructorName}</td>
                                    <td className="p-3 text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-primary" /> {c.startTime}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        <span className="inline-flex items-center gap-1 font-medium">
                                            <Users className="w-3 h-3" /> {c.bookedCount} / {c.capacity}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${c.isFull
                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                : 'bg-primary/10 text-primary border-primary/20'
                                                }`}
                                        >
                                            {c.isFull ? 'Dolu' : 'Müsait'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}