'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguageStore } from '@/lib/language.store';
import { ThemeLanguageToggle } from '@/components/theme.language.toggle';
import { LogOut, User } from 'lucide-react';

export function Header() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const t = useLanguageStore((state) => state.t());

    const handleLogout = (): void => {
        logout();
        router.push('/auth/login');
    };

    return (
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
            {/* Karşılama Metni */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t.navigation.welcome},</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    {user?.name || 'Kullanıcı'}
                </span>
            </div>

            {/* Sağ Taraf: Toggle'lar & Çıkış */}
            <div className="flex items-center gap-4">
                <ThemeLanguageToggle />

                <div className="h-4 w-px bg-border hidden sm:block" />

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-destructive/10"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.navigation.logout}</span>
                </button>
            </div>
        </header>
    );
}