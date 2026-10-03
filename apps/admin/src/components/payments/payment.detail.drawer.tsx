/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { DetailedPaymentResponse, financialsApi } from '@/lib/financials.api';
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    Package,
    CheckCircle2,
    Receipt,
    Loader2,
    Clock,
    CreditCard,
    Sparkles,
    Building2,
    Layers,
} from 'lucide-react';

interface PaymentDetailDrawerProps {
    paymentId: string | null;
    onClose: () => void;
}

export function PaymentDetailDrawer({ paymentId, onClose }: PaymentDetailDrawerProps) {
    const [isRendered, setIsRendered] = useState<boolean>(!!paymentId);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [paymentData, setPaymentData] = useState<DetailedPaymentResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Açılış / Kapanış Animasyon Yönetimi
    useEffect(() => {
        if (paymentId) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsVisible(true), 15);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [paymentId]);

    // Veri Çekimi
    useEffect(() => {
        if (!paymentId) return;

        let isMounted = true;
        setIsLoading(true);

        financialsApi
            .getPaymentById(paymentId)
            .then((data) => {
                if (isMounted) setPaymentData(data);
            })
            .catch((err) => {
                console.error('Ödeme detayı çekilemedi:', err);
                if (isMounted) setPaymentData(null);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [paymentId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // Ödeme Yöntemi Türkçe Karşılığı
    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'CREDIT_CARD':
                return 'Kredi Kartı';
            case 'CASH':
                return 'Nakit';
            case 'EFT':
                return 'EFT / Havale';
            case 'PAYTR':
                return 'Online (PayTR)';
            default:
                return method;
        }
    };

    // Branş İsimleri
    const formatDiscipline = (disc: string) => {
        switch (disc) {
            case 'REFORMER':
                return 'Reformer Pilates';
            case 'PILATES':
                return 'Mat Pilates';
            case 'YOGA':
                return 'Yoga';
            default:
                return disc;
        }
    };

    if (!isRendered || !paymentId) return null;

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex justify-end transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleClose}
        >
            <div
                className={`bg-card border-l border-border w-full max-w-lg h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground text-sm">Ödeme ve Fiş Detayı</h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Müşteri ve satın alım bilgileri
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* İçerik */}
                {isLoading ? (
                    <div className="p-12 flex-1 flex justify-center items-center text-xs text-muted-foreground gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Ödeme detayları hazırlanıyor...
                    </div>
                ) : !paymentData ? (
                    <div className="p-12 flex-1 text-center text-xs text-muted-foreground">
                        Ödeme detayları bulunamadı veya yüklenirken bir hata oluştu.
                    </div>
                ) : (
                    <div className="p-5 overflow-y-auto flex-1 space-y-5">
                        {/* 1. Tutar ve Ödeme Durum Kartı */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-muted-foreground font-medium block">Ödenen Tutar</span>
                                <span className="text-2xl font-bold text-emerald-500">
                                    ₺{paymentData.amount?.toLocaleString('tr-TR')}
                                </span>
                            </div>
                            <div className="text-right space-y-1">
                                {paymentData.status === 'SUCCESS' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Ödeme Başarılı
                                    </span>
                                )}
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                                    <span>{formatPaymentMethod(paymentData.paymentMethod)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Müşteri Kartı */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-primary" /> Müşteri Bilgileri
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Müşteri Adı:</span>
                                    <strong className="text-foreground text-sm">{paymentData.user?.name}</strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">E-Posta Adresi:</span>
                                    <span className="text-foreground flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-primary" /> {paymentData.user?.email}
                                    </span>
                                </div>
                                {paymentData.user?.phone && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Telefon Numarası:</span>
                                        <span className="text-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-primary" /> {paymentData.user?.phone}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Satın Alınan Paket Bilgileri */}
                        {paymentData.clientPackage && (
                            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-primary" /> Satın Alınan Paket
                                    </h3>
                                    {paymentData.clientPackage.status === 'ACTIVE' && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            Paket Aktif
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Paket Adı:</span>
                                        <strong className="text-foreground text-sm">
                                            {paymentData.clientPackage.package?.name}
                                        </strong>
                                    </div>

                                    {/* Kredi Kullanım Barı */}
                                    <div className="bg-input/60 p-3 rounded-xl space-y-1.5 border border-border">
                                        <div className="flex justify-between text-[11px] font-medium">
                                            <span className="text-muted-foreground">Kullanılan Ders Kredisi</span>
                                            <span className="text-foreground font-bold">
                                                {paymentData.clientPackage.creditsUsed} / {paymentData.clientPackage.creditsTotal} Ders
                                            </span>
                                        </div>
                                        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary h-full transition-all"
                                                style={{
                                                    width: `${(paymentData.clientPackage.creditsUsed /
                                                            paymentData.clientPackage.creditsTotal) *
                                                        100
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-muted-foreground">Geçerlilik Süresi:</span>
                                        <span className="text-foreground font-medium">
                                            {paymentData.clientPackage.package?.validityDays} Gün
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Son Kullanma Tarihi:</span>
                                        <span className="text-foreground flex items-center gap-1 font-semibold">
                                            <Calendar className="w-3 h-3 text-primary" />
                                            {new Date(paymentData.clientPackage.expiresAt).toLocaleDateString(
                                                'tr-TR',
                                                {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                }
                                            )}
                                        </span>
                                    </div>

                                    {/* İzin Verilen Branşlar */}
                                    {paymentData.clientPackage.package?.allowedDisciplines?.length > 0 && (
                                        <div className="pt-2 border-t border-border flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Layers className="w-3 h-3 text-primary" /> Geçerli Branşlar:
                                            </span>
                                            <div className="flex gap-1">
                                                {paymentData.clientPackage.package.allowedDisciplines.map(
                                                    (d: string) => (
                                                        <span
                                                            key={d}
                                                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase"
                                                        >
                                                            {formatDiscipline(d)}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. İşlem & Fatura Bilgileri */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 text-xs">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-primary" /> İşlem Detayları
                            </h3>

                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-primary" /> İşlem Tarihi:
                                </span>
                                <span className="text-foreground font-medium">
                                    {new Date(paymentData.createdAt).toLocaleString('tr-TR', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                </span>
                            </div>

                            {paymentData.invoiceNo && (
                                <div className="flex items-center justify-between text-muted-foreground pt-1">
                                    <span>Fatura Numarası:</span>
                                    <span className="font-mono font-bold text-foreground bg-input px-2 py-0.5 rounded border border-border">
                                        {paymentData.invoiceNo}
                                    </span>
                                </div>
                            )}

                            {paymentData.studio?.name && (
                                <div className="flex items-center justify-between text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-primary" /> İşlem Yapılan Stüdyo:
                                    </span>
                                    <span className="text-foreground font-semibold">
                                        {paymentData.studio.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}