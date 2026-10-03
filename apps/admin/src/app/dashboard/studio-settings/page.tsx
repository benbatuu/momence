/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { studioSettingsApi } from '@/lib/studio.settings.api';
import type { StudioConfig, DisciplineType, ServiceType } from '@/types/studio.types';
import { Building2, Save, Loader2, CheckCircle2, Sparkles, MapPin, Globe, DollarSign, AlertCircle } from 'lucide-react';

export default function StudioSettingsPage() {
    const t = useLanguageStore((state) => state.t());
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [formData, setFormData] = useState<StudioConfig & { address: string }>({
        id: '',
        name: '',
        slug: '',
        currency: 'TRY',
        timeZone: 'Europe/Istanbul',
        address: '',
        disciplines: ['PILATES', 'YOGA'],
        enabledServices: ['CLASS', 'APPOINTMENT'],
    });

    useEffect(() => {
        let isMounted = true;

        async function loadStudioSettings() {
            try {
                const data = await studioSettingsApi.getSettings();
                if (isMounted && data) {
                    setFormData(data);
                }
            } catch (err: any) {
                console.error('Stüdyo ayarları yüklenirken hata oluştu:', err);
                if (isMounted) {
                    setErrorMessage('Stüdyo ayarları yüklenemedi.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadStudioSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleDisciplineToggle = (discipline: DisciplineType) => {
        setFormData((prev) => {
            const exists = prev.disciplines.includes(discipline);
            if (exists) {
                return { ...prev, disciplines: prev.disciplines.filter((d) => d !== discipline) };
            }
            return { ...prev, disciplines: [...prev.disciplines, discipline] };
        });
    };

    const handleServiceToggle = (service: ServiceType) => {
        setFormData((prev) => {
            const exists = prev.enabledServices.includes(service);
            if (exists) {
                return { ...prev, enabledServices: prev.enabledServices.filter((s) => s !== service) };
            }
            return { ...prev, enabledServices: [...prev.enabledServices, service] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setShowSuccess(false);
        setErrorMessage('');

        try {
            const updatedData = await studioSettingsApi.updateSettings(formData);
            if (updatedData) {
                setFormData(updatedData);
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (err: any) {
            console.error('Ayarlar kaydedilirken hata oluştu:', err);
            setErrorMessage(err.response?.data?.message || 'Ayarlar kaydedilirken hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    const ALL_DISCIPLINES: { id: DisciplineType; label: string }[] = [
        { id: 'PILATES', label: 'Pilates (Mat & Reformer)' },
        { id: 'YOGA', label: 'Yoga' },
        { id: 'DANCE', label: 'Dans & Koreografi' },
        { id: 'FITNESS_GYM', label: 'Fitness & Gym' },
        { id: 'MARTIAL_ARTS', label: 'Dövüş Sanatları' },
        { id: 'WELLNESS_SPA', label: 'Wellness & Terapi' },
    ];

    const ALL_SERVICES: { id: ServiceType; label: string; desc: string }[] = [
        { id: 'CLASS', label: 'Grup Dersleri', desc: 'Sınıf bazlı toplu seanslar' },
        { id: 'APPOINTMENT', label: 'Birebir Özel Seanslar', desc: '1-on-1 randevular' },
        { id: 'WORKSHOP', label: 'Atölyeler & Masterclass', desc: 'Tekil/özel etkinlikler' },
        { id: 'COURSE', label: 'Çok Haftalık Kurslar', desc: 'Seri eğitim paketleri' },
        { id: 'RETREAT', label: 'Kamp & Retreat', desc: 'Konaklamalı spor kampları' },
    ];

    if (isLoading) {
        return (
            <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl max-w-7xl mx-auto">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Yükleniyor...
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    {t.studioSettings.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{t.studioSettings.subtitle}</p>
            </div>

            {errorMessage && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {showSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t.studioSettings.successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Genel Bilgiler */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {t.studioSettings.generalInfo}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.studioSettings.studioName}</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.studioSettings.slug}</label>
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-primary" /> {t.studioSettings.currency}
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="TRY">Türk Lirası (₺)</option>
                                <option value="USD">US Dollar ($)</option>
                                <option value="EUR">Euro (€)</option>
                                <option value="GBP">British Pound (£)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5 text-primary" /> {t.studioSettings.timeZone}
                            </label>
                            <select
                                value={formData.timeZone}
                                onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New_York (EST)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> {t.studioSettings.address}
                        </label>
                        <textarea
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Aktif Disiplinler */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">
                        {t.studioSettings.enabledDisciplines}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {ALL_DISCIPLINES.map((d) => {
                            const isSelected = formData.disciplines.includes(d.id);
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => handleDisciplineToggle(d.id)}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${isSelected
                                        ? 'bg-primary/10 border-primary text-foreground font-semibold'
                                        : 'bg-input border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <span className="text-xs">{d.label}</span>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Aktif Hizmet Türleri */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">
                        {t.studioSettings.enabledServices}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {ALL_SERVICES.map((s) => {
                            const isSelected = formData.enabledServices.includes(s.id);
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleServiceToggle(s.id)}
                                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${isSelected
                                        ? 'bg-primary/10 border-primary text-foreground'
                                        : 'bg-input border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">{s.label}</span>
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{isSaving ? t.studioSettings.saving : t.studioSettings.saveChanges}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}