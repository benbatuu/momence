'use client';

import React from 'react';
import { CalendarCheck2, Users, AlertCircle, Sparkles } from 'lucide-react';
import type { ClassSessionDetail } from '@/lib/schedule.api';

interface ScheduleStatsProps {
    sessions: ClassSessionDetail[];
}

export function ScheduleStats({ sessions }: ScheduleStatsProps) {
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.status === 'SCHEDULED').length;

    let totalCapacity = 0;
    let totalBooked = 0;
    let totalWaitlist = 0;

    sessions.forEach((s) => {
        totalCapacity += s.capacity;
        const confirmedCount = s.bookings?.filter((b) => b.status === 'CONFIRMED').length || s._count?.bookings || 0;
        const waitlistCount = s.bookings?.filter((b) => b.status === 'WAITLIST').length || 0;
        totalBooked += confirmedCount;
        totalWaitlist += waitlistCount;
    });

    const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Bugünkü Seanslar</span>
                    <span className="text-base font-bold text-foreground">
                        {activeSessions} <span className="text-xs font-normal text-muted-foreground">/ {totalSessions} Toplam</span>
                    </span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Users className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Doluluk</span>
                    <span className="text-base font-bold text-foreground">
                        {totalBooked} <span className="text-xs font-normal text-muted-foreground">/ {totalCapacity} Koltuk</span>
                    </span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Doluluk Oranı</span>
                    <span className="text-base font-bold text-foreground">%{occupancyRate}</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Yedek Sıradakiler</span>
                    <span className="text-base font-bold text-foreground">{totalWaitlist} Kişi</span>
                </div>
            </div>
        </div>
    );
}