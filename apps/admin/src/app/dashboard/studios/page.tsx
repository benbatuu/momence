'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
    CreditCard,
    Building,
    AlertCircle,
    X,
    ExternalLink,
    ShieldAlert,
} from 'lucide-react';
import { studioApi, StudioListItem, PlatformMetrics } from '@/lib/studio.api';
import { AxiosError } from 'axios';

export default function StudiosPage() {
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [studios, setStudios] = useState<StudioListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [error, setError] = useState<string>('');

    // Modal Durumları
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string>('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        phone: '',
        taxNumber: '',
        taxOffice: '',
        address: '',
        currency: 'TRY',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active';
            const [metricsData, studiosData] = await Promise.all([
                studioApi.getMetrics().catch(() => null),
                studioApi.getStudios(search, isActive),
            ]);

            if (metricsData) setMetrics(metricsData);
            setStudios(studiosData);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Stüdyolar yüklenirken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadData]);

    // Stüdyo Aktif/Pasif Yap
    const handleToggleStatus = async (studio: StudioListItem) => {
        const newStatus = !studio.isActive;
        const confirmText = newStatus
            ? `"${studio.name}" stüdyosunu tekrar aktif yapmak istiyor musunuz?`
            : `"${studio.name}" stüdyosunu dondurmak/pasife almak istiyor musunuz? Bağlı kullanıcıların oturumları kapatılacaktır.`;

        if (!window.confirm(confirmText)) return;

        try {
            await studioApi.toggleStudioStatus(studio.id, newStatus);
            loadData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Durum değiştirilemedi.');
            }
        }
    };

    // Yeni Stüdyo Ekleme Submit
    const handleCreateStudio = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        setIsSubmitting(true);

        try {
            await studioApi.createStudio(formData);
            setIsModalOpen(false);
            setFormData({
                name: '',
                subdomain: '',
                phone: '',
                taxNumber: '',
                taxOffice: '',
                address: '',
                currency: 'TRY',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
            });
            loadData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setModalError(err.response?.data?.message || 'Stüdyo oluşturulurken bir hata oluştu.');
            } else {
                setModalError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Başlık ve Aksiyon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary" /> Stüdyo Yönetimi
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Platformdaki tüm stüdyoları yönetin, yeni stüdyolar ekleyin veya dondurun.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 active:scale-[0.99] text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Yeni Stüdyo Oluştur
                </button>
            </div>

            {/* Platform Metrik Kartları */}
            {metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Toplam Stüdyo</p>
                            <h3 className="text-xl font-bold text-foreground">{metrics.totalStudios}</h3>
                        </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Aktif Stüdyo</p>
                            <h3 className="text-xl font-bold text-foreground">{metrics.activeStudios}</h3>
                        </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Toplam Kullanıcı</p>
                            <h3 className="text-xl font-bold text-foreground">{metrics.totalUsers}</h3>
                        </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Toplam Platform Ciro</p>
                            <h3 className="text-xl font-bold text-foreground">
                                ₺{metrics.totalRevenue.toLocaleString('tr-TR')}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Arama ve Filtreleme */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Stüdyo adı veya subdomain ara..."
                        className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-xs text-muted-foreground font-medium">Durum:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Sadece Aktifler</option>
                        <option value="inactive">Sadece Pasifler (Dondurulmuş)</option>
                    </select>
                </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Tablo Tabakası */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-foreground">
                        <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3">Stüdyo Adı & Subdomain</th>
                                <th className="px-4 py-3">İletişim</th>
                                <th className="px-4 py-3 text-center">Kullanıcı</th>
                                <th className="px-4 py-3 text-center">Ders Seansı</th>
                                <th className="px-4 py-3 text-center">Durum</th>
                                <th className="px-4 py-3 text-right">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                        Stüdyolar yükleniyor...
                                    </td>
                                </tr>
                            ) : studios.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        Aradığınız kriterlere uygun stüdyo bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                studios.map((studio) => (
                                    <tr key={studio.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                {studio.name}
                                                <a
                                                    href={`https://${studio.subdomain}.yourdomain.com`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title="Stüdyo Portalı"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                {studio.subdomain}.yourdomain.com
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-muted-foreground">
                                            <div>{studio.phone || '-'}</div>
                                            <div className="text-[10px]">{studio.address || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-medium">
                                            {studio._count?.users || 0}
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-medium">
                                            {studio._count?.classSessions || 0}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {studio.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                                    <XCircle className="w-3 h-3" /> Pasif / Dondurulmuş
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => handleToggleStatus(studio)}
                                                className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer border ${studio.isActive
                                                    ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20'
                                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                                                    }`}
                                            >
                                                {studio.isActive ? 'Dondur / Pasif Yap' : 'Aktif Yap'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Yeni Stüdyo Ekleme Modalı */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" /> Yeni Stüdyo & Admin Oluştur
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateStudio} className="p-4 space-y-4 overflow-y-auto flex-1">
                            {modalError && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {/* Stüdyo Temel Bilgileri */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    1. Stüdyo Bilgileri
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Stüdyo Adı *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="OM Pilates Studio"
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Subdomain *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subdomain}
                                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().trim() })}
                                            placeholder="om-pilates"
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Telefon</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+905551112233"
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Para Birimi</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="TRY">TRY (₺)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border my-2" />

                            {/* İlk Stüdyo Admini Bilgileri */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    2. İlk Stüdyo Admin Hesabı
                                </h3>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-foreground">Admin Ad Soyad *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        placeholder="Ayşe Kaya"
                                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Admin E-Posta *</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                            placeholder="admin@ompilates.com"
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Giriş Şifresi</label>
                                        <input
                                            type="password"
                                            value={formData.adminPassword}
                                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                            placeholder="Varsayılan: 123456"
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs rounded-xl transition-all cursor-pointer"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Oluşturuluyor...
                                        </>
                                    ) : (
                                        'Stüdyoyu Oluştur'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}