'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, isLoading, initializeAuth } = useAuthStore();

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Auth durumu henüz yükleniyorsa veya kullanıcı objesi çekilmediyse Spinner göster
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Yükleme tamamlandığında gerçek kullanıcı rolünü Sidebar'a aktar
    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar userRole={user?.role || 'CLIENT'} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}