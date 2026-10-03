'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguageStore } from '@/lib/language.store';
import type { Role } from '@/types';
import { UserPlus, CalendarPlus, PackagePlus, BookmarkPlus, Building2, ShieldAlert } from 'lucide-react';

interface QuickActionsProps {
    role: Role;
}

export function QuickActions({ role }: QuickActionsProps) {
    const t = useLanguageStore((state) => state.t());

    const actions = [
        { label: 'Yeni Stüdyo Ekle', href: '/dashboard/studios', icon: Building2, roles: ['SUPER_ADMIN'] as Role[] },
        { label: 'Denetim Logları', href: '/dashboard/audit-logs', icon: ShieldAlert, roles: ['SUPER_ADMIN'] as Role[] },
        { label: t.dashboard.addNewMember, href: '/dashboard/users?action=new', icon: UserPlus, roles: ['SUPER_ADMIN', 'ADMIN'] as Role[] },
        { label: t.dashboard.createClass, href: '/dashboard/classes?action=new', icon: CalendarPlus, roles: ['ADMIN', 'INSTRUCTOR'] as Role[] },
        { label: t.dashboard.newPackage, href: '/dashboard/packages?action=new', icon: PackagePlus, roles: ['SUPER_ADMIN', 'ADMIN'] as Role[] },
        { label: t.dashboard.bookClass, href: '/dashboard/classes', icon: BookmarkPlus, roles: ['CLIENT'] as Role[] },
    ];

    const filteredActions = actions.filter((a) => a.roles.includes(role));

    if (filteredActions.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.dashboard.quickActions}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all group cursor-pointer shadow-xs"
                        >
                            <div className="p-2 rounded-lg bg-input text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground truncate">{action.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}