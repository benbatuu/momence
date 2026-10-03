'use client';

import React from 'react';
import { Dumbbell, CheckCircle2, Clock, Banknote } from 'lucide-react';
import type { AppointmentItem } from '@/lib/appointments.api';

interface AppointmentStatsProps {
    appointments: AppointmentItem[];
}

export function AppointmentStats({ appointments }: AppointmentStatsProps) {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const totalRevenue = appointments
        .filter((a) => a.status !== 'CANCELLED')
        .reduce((sum, a) => sum + (a.price || 0), 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Randevu</span>
                    <span className="text-base font-bold text-foreground">{total} Seans</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Onaylı Seanslar</span>
                    <span className="text-base font-bold text-foreground">{confirmed} Randevu</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Tamamlanan</span>
                    <span className="text-base font-bold text-foreground">{completed} Seans</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Banknote className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Tutar</span>
                    <span className="text-base font-bold text-foreground">₺{totalRevenue.toLocaleString('tr-TR')}</span>
                </div>
            </div>
        </div>
    );
}