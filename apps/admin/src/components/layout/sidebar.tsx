'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguageStore } from '@/lib/language.store';
import { MOMENCE_NAVIGATION } from '@/config/navigation';
import type { Role } from '@/types';
import type { StudioConfig } from '@/types/studio.types';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    userRole: Role;
    studioConfig?: StudioConfig;
}

export function Sidebar({ userRole, studioConfig }: SidebarProps) {
    const pathname = usePathname();
    const t = useLanguageStore((state) => state.t());

    // Sidebar durumunu localStorage senkronlu yönetelim
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const savedState = localStorage.getItem('om-sidebar-collapsed');
        return savedState === 'true';
    });

    const toggleSidebar = (): void => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('om-sidebar-collapsed', String(nextState));
    };

    const getTranslation = (path: string): string => {
        const keys = path.split('.');
        let current: unknown = t;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = (current as Record<string, unknown>)[key];
            } else {
                return path;
            }
        }
        return typeof current === 'string' ? current : path;
    };

    return (
        <aside
            className={`bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out relative z-40 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Daraltma / Genişletme Butonu */}
            <button
                type="button"
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 bg-card border border-border text-foreground hover:bg-accent rounded-full p-1 shadow-md transition-transform duration-200 hover:scale-110 cursor-pointer z-50"
                title={isCollapsed ? 'Genişlet' : 'Daralt'}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                    <ChevronLeft className="w-3.5 h-3.5" />
                )}
            </button>

            {/* Brand Header */}
            <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0 overflow-hidden">
                <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div
                        className={`min-w-0 flex-1 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none w-0 hidden' : 'opacity-100'
                            }`}
                    >
                        <h2 className="font-bold text-foreground text-sm tracking-tight truncate">
                            {userRole === 'SUPER_ADMIN'
                                ? 'SaaS Platform Admin'
                                : studioConfig?.name || 'Studio Platform'}
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                            {userRole === 'SUPER_ADMIN' ? 'Super Admin Mode' : 'Momence SaaS'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 p-3 space-y-5 overflow-y-auto overflow-x-hidden">
                {MOMENCE_NAVIGATION.map((group) => {
                    const visibleItems = group.items.filter((item) => {
                        // 1. Rol Kontrolü
                        if (!item.roles.includes(userRole)) return false;

                        // 2. SUPER_ADMIN tüm servis kısıtlamalarından muaf tutulur
                        if (userRole === 'SUPER_ADMIN') return true;

                        // 3. Stüdyo bazlı servis kısıtlama kontrolü
                        if (item.requiredServices && studioConfig) {
                            return item.requiredServices.some((s) =>
                                studioConfig.enabledServices.includes(s)
                            );
                        }

                        return true;
                    });

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.groupTitleKey} className="space-y-1.5">
                            {/* Grup Başlığı */}
                            {!isCollapsed ? (
                                <h3 className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider truncate">
                                    {getTranslation(group.groupTitleKey)}
                                </h3>
                            ) : (
                                <div className="h-px bg-sidebar-border my-2 px-2" />
                            )}

                            {/* Menü Elemanları */}
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    const title = getTranslation(item.titleKey);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={isCollapsed ? title : undefined}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${isActive
                                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span
                                                className={`truncate transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'
                                                    }`}
                                            >
                                                {title}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}