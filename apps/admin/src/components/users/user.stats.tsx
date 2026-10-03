'use client';

import React from 'react';
import { Users, UserCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import type { UserDetailItem } from '@/lib/users.api';

interface UserStatsProps {
    users: UserDetailItem[];
}

export function UserStats({ users }: UserStatsProps) {
    const totalUsers = users.length;
    const clientsCount = users.filter((u) => u.role === 'CLIENT').length;
    const instructorsCount = users.filter((u) => u.role === 'INSTRUCTOR').length;
    const adminsCount = users.filter((u) => u.role === 'ADMIN').length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Users className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Toplam Kullanıcı</span>
                    <span className="text-base font-bold text-foreground">{totalUsers} Kişi</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <UserCheck className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Danışanlar / Üyeler</span>
                    <span className="text-base font-bold text-foreground">{clientsCount} Üye</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Eğitmen Kadrosu</span>
                    <span className="text-base font-bold text-foreground">{instructorsCount} Eğitmen</span>
                </div>
            </div>

            <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[11px] text-muted-foreground font-medium block">Yöneticiler</span>
                    <span className="text-base font-bold text-foreground">{adminsCount} Admin</span>
                </div>
            </div>
        </div>
    );
}