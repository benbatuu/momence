'use client';

import React from 'react';
import { Video, Lock, Clock, CheckCircle2 } from 'lucide-react';
import type { OnDemandVideo } from '@/lib/videos.api';

interface OnDemandStatsProps {
    videos: OnDemandVideo[];
}

export function OnDemandStats({ videos }: OnDemandStatsProps) {
    const total = videos.length;
    // backend: isMembersOnly yerine isRequiredPackage kullanılıyor
    const packageRequiredCount = videos.filter((v) => v.isRequiredPackage).length;
    const activeCount = videos.filter((v) => v.isActive).length;

    // backend: durationMinutes yerine durationSec (saniye) tutuluyor -> toplam dakikaya çeviriyoruz
    const totalSeconds = videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Video className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Video</span>
                    <span className="text-base font-bold text-foreground">{total} İçerik</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Lock className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Paket Zorunlu</span>
                    <span className="text-base font-bold text-foreground">{packageRequiredCount} Video</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Aktif İçerik</span>
                    <span className="text-base font-bold text-foreground">{activeCount} Video</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Kütüphane Süresi</span>
                    <span className="text-base font-bold text-foreground">{totalMinutes} Dakika</span>
                </div>
            </div>
        </div>
    );
}