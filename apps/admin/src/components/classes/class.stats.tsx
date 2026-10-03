'use client';

import React from 'react';
import { Dumbbell, Layers, Sparkles, Activity } from 'lucide-react';
import type { ClassDefinitionItem } from '@/lib/classes.api';

interface ClassStatsProps {
    classes: ClassDefinitionItem[];
}

export function ClassStats({ classes }: ClassStatsProps) {
    const totalClasses = classes.length;
    const activeClasses = classes.filter((c) => c.isActive).length;

    const disciplinesCount = new Set(classes.map((c) => c.discipline)).size;
    const avgCapacity =
        totalClasses > 0
            ? Math.round(classes.reduce((acc, c) => acc + (c.maxCapacity || 0), 0) / totalClasses)
            : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Şablon</span>
                    <span className="text-base font-bold text-foreground">{totalClasses} Tanım</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Aktif Kullanımda</span>
                    <span className="text-base font-bold text-foreground">{activeClasses} Şablon</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Layers className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Farklı Disiplin</span>
                    <span className="text-base font-bold text-foreground">{disciplinesCount} Branş</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Activity className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Ort. Kapasite</span>
                    <span className="text-base font-bold text-foreground">{avgCapacity} Kişi / Ders</span>
                </div>
            </div>
        </div>
    );
}