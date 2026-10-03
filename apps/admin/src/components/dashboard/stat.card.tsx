'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{title}</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
                {(description || trend) && (
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        {trend && <span className="text-primary font-semibold">{trend}</span>}
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}