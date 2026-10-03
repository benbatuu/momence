'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User, Mail, Phone, Lock, Loader2, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface RegisterFormData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

interface ApiErrorResponse {
    message?: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler birbiriyle eşleşmiyor.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Şifreniz en az 6 karakter olmalıdır.');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });

            setIsSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const serverError = err.response?.data as ApiErrorResponse | undefined;
                setError(serverError?.message || 'Kayıt olunurken bir hata oluştu.');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-4 bg-card border border-border p-8 rounded-xl shadow-xs">
                <div className="w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Hesabınız Oluşturuldu!</h2>
                <p className="text-xs text-muted-foreground">
                    Kaydınız başarıyla tamamlandı. Giriş sayfasına yönlendiriliyorsunuz...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Form Başlığı */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Aramıza Katılın ✨</h2>
                <p className="text-sm text-muted-foreground">OM Pilates Studio üyelik hesabınızı hemen oluşturun.</p>
            </div>

            {/* Tab Geçişi */}
            <div className="flex bg-muted p-1 rounded-lg border border-border">
                <Link
                    href="/auth/login"
                    className="flex-1 text-center py-2 text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                    Giriş Yap
                </Link>
                <div className="flex-1 text-center py-2 text-xs font-semibold rounded-md bg-card text-card-foreground shadow-xs">
                    Kayıt Ol
                </div>
            </div>

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3.5 text-xs text-destructive flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{error}</div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Ad Soyad */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Ad Soyad</label>
                    <div className="relative">
                        <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ahmet Yılmaz"
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                </div>

                {/* E-Posta */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">E-Posta Adresi</label>
                    <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="ahmet@example.com"
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                </div>

                {/* Telefon */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Telefon Numarası</label>
                    <div className="relative">
                        <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0555 123 45 67"
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                </div>

                {/* Şifreler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Şifre</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Şifre Tekrarı</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Butonu */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-primary hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-3"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Kayıt Ediliyor...
                        </>
                    ) : (
                        <>
                            Hesap Oluştur <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}