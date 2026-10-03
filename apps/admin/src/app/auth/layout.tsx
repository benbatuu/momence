'use client';

import React from 'react';
import { Dumbbell, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            {/* Sol Showcase Paneli */}
            <div className="lg:flex-1 relative bg-muted/40 p-8 sm:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
                {/* Soft Ambient Glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Brand Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-foreground tracking-tight">OM Pilates</h1>
                        <p className="text-xs text-muted-foreground">Studio Management</p>
                    </div>
                </div>

                {/* Hero İçerik */}
                <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border border-border text-xs font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Yeni Nesil Stüdyo Yönetimi</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                        Pilates derslerinizi, üyelerinizi ve paketlerinizi{' '}
                        <span className="text-primary underline decoration-primary/30 underline-offset-4">
                            tek noktadan
                        </span>{' '}
                        yönetin.
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Eğitmenler, danışanlar ve yönetim ekibi için tasarlanmış esnek, hızlı ve role dayalı yönetim paneli.
                    </p>
                </div>

                {/* Alt Bilgi */}
                <div className="relative z-10 text-xs text-muted-foreground flex items-center justify-between pt-6 border-t border-border">
                    <span>&copy; {new Date().getFullYear()} OM Pilates Studio</span>
                </div>
            </div>

            {/* Sağ Form Alanı */}
            <div className="lg:w-[480px] xl:w-[540px] flex items-center justify-center p-6 sm:p-12 bg-background">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}