'use client';

import React from 'react';
import { Award, CheckCircle2, Layers, Banknote } from 'lucide-react';
import type { InstructorProfile } from '@/lib/instructors.api';

interface InstructorStatsProps {
    instructors: InstructorProfile[];
}

export function InstructorStats({ instructors }: InstructorStatsProps) {
    const total = instructors.length;
    const active = instructors.filter((i) => i.isActive).length;

    // Tüm uzmanlık branşlarının kümesi
    const allSpecialties = new Set(instructors.flatMap((i) => i.specialties || []));

    // Ortalama seans ücreti
    const avgRate =
        total > 0
            ? Math.round(instructors.reduce((sum, i) => sum + (i.hourlyRate || 0), 0) / total)
            : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Award className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Eğitmen</span>
                    <span className="text-base font-bold text-foreground">{total} Kişi</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Aktif Kadro</span>
                    <span className="text-base font-bold text-foreground">{active} Eğitmen</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Layers className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Branş Çeşitliliği</span>
                    <span className="text-base font-bold text-foreground">{allSpecialties.size} Alan</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Banknote className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Ort. Seans Ücreti</span>
                    <span className="text-base font-bold text-foreground">₺{avgRate} / Seans</span>
                </div>
            </div>
        </div>
    );
}