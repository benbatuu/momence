/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { usersApi, UserDetailItem } from '@/lib/users.api';
import {
    X,
    User,
    Mail,
    Phone,
    Shield,
    Calendar,
    CreditCard,
    CheckCircle2,
    XCircle,
    PackageCheck,
    History,
    Building2,
    AlertTriangle,
    Loader2,
} from 'lucide-react';

interface UserDetailDrawerProps {
    userId: string | null;
    onClose: () => void;
    onRefresh: () => void;
}

export function UserDetailDrawer({ userId, onClose, onRefresh }: UserDetailDrawerProps) {
    const [isRendered, setIsRendered] = useState<boolean>(!!userId);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [user, setUser] = useState<UserDetailItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PACKAGES' | 'ATTENDANCE' | 'PAYMENTS'>('OVERVIEW');

    // Animasyon Handling
    useEffect(() => {
        if (userId) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsVisible(true), 15);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [userId]);

    // Kullanıcı Detaylarını Canlı Yükle
    useEffect(() => {
        if (!userId) return;

        let isMounted = true;
        setIsLoading(true);

        usersApi
            .getUserById(userId)
            .then((data) => {
                if (isMounted) setUser(data);
            })
            .catch(() => {
                if (isMounted) setUser(null);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [userId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleToggleActive = async () => {
        if (!user) return;
        try {
            await usersApi.toggleUserStatus(user.id, !user.isActive);
            setUser((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
            onRefresh();
        } catch (err) {
            console.error('Kullanıcı durumu değiştirilemedi:', err);
        }
    };

    if (!isRendered || !userId) return null;

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex justify-end transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleClose}
        >
            <div
                className={`bg-card border-l border-border w-full max-w-2xl h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground text-base leading-tight">
                                {user?.name || 'Kullanıcı Detayı'}
                            </h2>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {user && (
                            <button
                                onClick={handleToggleActive}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${user.isActive
                                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                    }`}
                            >
                                {user.isActive ? 'Aktif Üye' : 'Pasif Üye'}
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tab Sekmeleri */}
                <div className="flex border-b border-border bg-input/40 px-5 gap-4 text-xs font-semibold overflow-x-auto shrink-0">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'OVERVIEW'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" /> Genel Bilgiler
                    </button>
                    <button
                        onClick={() => setActiveTab('PACKAGES')}
                        className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'PACKAGES'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <PackageCheck className="w-3.5 h-3.5" /> Paketler & Krediler
                    </button>
                    <button
                        onClick={() => setActiveTab('ATTENDANCE')}
                        className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ATTENDANCE'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <History className="w-3.5 h-3.5" /> Ders Katılımları
                    </button>
                    <button
                        onClick={() => setActiveTab('PAYMENTS')}
                        className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'PAYMENTS'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" /> Ödemeler
                    </button>
                </div>

                {/* İçerik Alanı */}
                {isLoading ? (
                    <div className="p-12 flex-1 flex justify-center items-center text-xs text-muted-foreground gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Kullanıcı verileri yükleniyor...
                    </div>
                ) : !user ? (
                    <div className="p-12 flex-1 text-center text-xs text-muted-foreground">
                        Kullanıcı detayları bulunamadı.
                    </div>
                ) : (
                    <div className="p-5 overflow-y-auto flex-1 space-y-5">
                        {/* TAB 1: GENEL BİLGİLER */}
                        {activeTab === 'OVERVIEW' && (
                            <div className="space-y-5 animate-in fade-in duration-200">
                                {/* İstatistik Metrikleri */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                        <span className="text-[10px] text-muted-foreground block font-medium">Toplam Harcama</span>
                                        <span className="text-sm font-bold text-foreground">₺{user.stats?.totalSpent || 0}</span>
                                    </div>
                                    <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                        <span className="text-[10px] text-muted-foreground block font-medium">Katıldığı Ders</span>
                                        <span className="text-sm font-bold text-foreground">{user.stats?.totalAttended || 0} Seans</span>
                                    </div>
                                    <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                        <span className="text-[10px] text-muted-foreground block font-medium">No-Show Sayısı</span>
                                        <span className="text-sm font-bold text-destructive">{user.stats?.noShowCount || 0} Ders</span>
                                    </div>
                                    <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                        <span className="text-[10px] text-muted-foreground block font-medium">Aktif Paketler</span>
                                        <span className="text-sm font-bold text-primary">{user.stats?.activePackagesCount || 0} Paket</span>
                                    </div>
                                </div>

                                {/* Profil Detay Kartı */}
                                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                        Profil Detayları (Super Admin)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="text-muted-foreground">E-Posta:</span>
                                            <strong className="text-foreground">{user.email}</strong>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="text-muted-foreground">Telefon:</span>
                                            <strong className="text-foreground">{user.phone || 'Belirtilmedi'}</strong>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="text-muted-foreground">Sistem Rolü:</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="text-muted-foreground">Stüdyo:</span>
                                            <strong className="text-foreground">{user.studioName || 'Ana Stüdyo'}</strong>
                                        </div>
                                        <div className="flex items-center gap-2 col-span-2">
                                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="text-muted-foreground">Kayıt Tarihi:</span>
                                            <strong className="text-foreground">
                                                {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Acil Durum İletişim */}
                                {user.emergencyContact && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2 text-xs">
                                        <h3 className="font-bold text-amber-500 flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4" /> Acil Durum İrtibat Bilgisi
                                        </h3>
                                        <div className="text-foreground">
                                            <strong>{user.emergencyContact.name}</strong> ({user.emergencyContact.relation}) —{' '}
                                            <span className="font-mono">{user.emergencyContact.phone}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: PAKETLER & KREDİLER */}
                        {activeTab === 'PACKAGES' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {(!user.packages || user.packages.length === 0) ? (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic">
                                        Kullanıcıya tanımlı aktif veya geçmiş paket bulunmuyor.
                                    </div>
                                ) : (
                                    user.packages.map((pkg) => (
                                        <div key={pkg.id} className="p-4 bg-card border border-border rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-xs text-foreground">{pkg.packageName}</h4>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pkg.status === 'ACTIVE'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                        }`}
                                                >
                                                    {pkg.status === 'ACTIVE' ? 'Kullanımda' : 'Süresi Doldu'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                                <span>
                                                    Kalan Hak:{' '}
                                                    <strong className="text-foreground">
                                                        {pkg.remainingCredits} / {pkg.totalCredits} Kredi
                                                    </strong>
                                                </span>
                                                <span>Son Kullanma: {pkg.expiresAt}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* TAB 3: DERS KATILIMLARI */}
                        {activeTab === 'ATTENDANCE' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {(!user.attendances || user.attendances.length === 0) ? (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic">
                                        Kullanıcının katıldığı ders seansı bulunmuyor.
                                    </div>
                                ) : (
                                    user.attendances.map((att) => (
                                        <div key={att.id} className="p-3 bg-card border border-border rounded-2xl flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-foreground">{att.sessionTitle}</div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {att.date} — Eğitmen: {att.instructorName}
                                                </div>
                                            </div>

                                            {att.status === 'ATTENDED' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Katıldı
                                                </span>
                                            )}
                                            {att.status === 'NO_SHOW' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Gelmedi
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* TAB 4: ÖDEMELER */}
                        {activeTab === 'PAYMENTS' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {(!user.payments || user.payments.length === 0) ? (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic">
                                        Kullanıcıya ait ödeme kaydı bulunmuyor.
                                    </div>
                                ) : (
                                    user.payments.map((pmt) => (
                                        <div key={pmt.id} className="p-3 bg-card border border-border rounded-2xl flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-foreground">{pmt.description}</div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {pmt.date} • {pmt.paymentMethod}
                                                </div>
                                            </div>
                                            <div className="font-bold text-foreground text-sm">
                                                ₺{pmt.amount.toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}