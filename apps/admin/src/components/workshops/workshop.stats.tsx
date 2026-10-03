'use client';

import React from 'react';
import { Sparkles, Ticket, Users, Banknote } from 'lucide-react';
import type { WorkshopItem } from '@/lib/workshops.api';

interface WorkshopStatsProps {
    workshops: WorkshopItem[];
}

export function WorkshopStats({ workshops }: WorkshopStatsProps) {
    const total = workshops.length;
    const totalCapacity = workshops.reduce((sum, w) => sum + (w.capacity || 0), 0);
    const totalBooked = workshops.reduce((sum, w) => sum + (w.bookedCount || 0), 0);
    const totalRevenue = workshops.reduce((sum, w) => sum + (w.bookedCount || 0) * (w.price || 0), 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Etkinlik Sayısı</span>
                    <span className="text-base font-bold text-foreground">{total} Atölye</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Ticket className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Satılan Bilet</span>
                    <span className="text-base font-bold text-foreground">{totalBooked} Adet</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Users className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Kapasite</span>
                    <span className="text-base font-bold text-foreground">{totalCapacity} Koltuk</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Banknote className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Etkinlik Cirosu</span>
                    <span className="text-base font-bold text-foreground">₺{totalRevenue.toLocaleString('tr-TR')}</span>
                </div>
            </div>
        </div>
    );
}