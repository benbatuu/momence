'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth.store';
import { Lock, Mail, Loader2, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
    message?: string;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const { login } = useAuthStore();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email, password });
            router.push(callbackUrl);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const serverError = err.response?.data as ApiErrorResponse | undefined;
                setError(serverError?.message || 'E-posta adresi veya şifre hatalı.');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Giriş yapılırken beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Form Başlığı */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Tekrar Hoş Geldiniz 👋</h2>
                <p className="text-sm text-muted-foreground">Devam etmek için hesabınıza giriş yapın.</p>
            </div>

            {/* Tab Geçişi */}
            <div className="flex bg-muted p-1 rounded-lg border border-border">
                <div className="flex-1 text-center py-2 text-xs font-semibold rounded-md bg-card text-card-foreground shadow-xs">
                    Giriş Yap
                </div>
                <Link
                    href="/auth/register"
                    className="flex-1 text-center py-2 text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                    Kayıt Ol
                </Link>
            </div>

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3.5 text-xs text-destructive flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{error}</div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* E-Posta Input */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">E-Posta Adresi</label>
                    <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            placeholder="ornek@ompilates.com"
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                </div>

                {/* Şifre Input */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">Şifre</label>
                        <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline transition-all">
                            Şifremi Unuttum?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Beni Hatırla */}
                <div className="flex items-center gap-2 pt-1">
                    <input
                        type="checkbox"
                        id="remember"
                        className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-ring cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                        Beni bu cihazda hatırla
                    </label>
                </div>

                {/* Submit Butonu */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-primary hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Giriş Yapılıyor...
                        </>
                    ) : (
                        <>
                            Giriş Yap <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={<div>Yükleniyor...</div>}>
            <LoginForm />
        </React.Suspense>
    );
}