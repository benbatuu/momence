'use client';

import React from 'react';
import { Ticket, Layers, Sparkles, Banknote } from 'lucide-react';
import type { PackageTemplate } from '@/lib/packages.api';

interface PackageStatsProps {
    packages: PackageTemplate[];
}

export function PackageStats({ packages }: PackageStatsProps) {
    const total = packages.length;
    const creditPacks = packages.filter((p) => p.type === 'CREDIT_PACK').length;
    const unlimitedPacks = packages.filter((p) => p.type === 'UNLIMITED').length;

    const avgPrice =
        total > 0
            ? Math.round(packages.reduce((sum, p) => sum + (p.price || 0), 0) / total)
            : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Ticket className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Şablon</span>
                    <span className="text-base font-bold text-foreground">{total} Paket</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Layers className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Kredili Paketler</span>
                    <span className="text-base font-bold text-foreground">{creditPacks} Çeşit</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Sınırsız Üyelikler</span>
                    <span className="text-base font-bold text-foreground">{unlimitedPacks} Çeşit</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Banknote className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Ortalama Fiyat</span>
                    <span className="text-base font-bold text-foreground">₺{avgPrice.toLocaleString('tr-TR')}</span>
                </div>
            </div>
        </div>
    );
}