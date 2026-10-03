/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { packagesApi, PackageTemplate, CreatePackagePayload, PackageType } from '@/lib/packages.api';
import type { DisciplineType } from '@/types/studio.types';
import { X, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface PackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: PackageTemplate | null;
}

export function PackageModal({ isOpen, onClose, onSuccess, initialData }: PackageModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [formData, setFormData] = useState<CreatePackagePayload>({
        name: '',
        description: '',
        type: 'CREDIT_PACK',
        credits: 10,
        price: 1500,
        validityDays: 30,
        allowedDisciplines: ['PILATES', 'YOGA'],
        allowedServices: ['CLASS'],
    });

    // Animasyon Handling
    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsVisible(true), 15);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Initial Data Güncelleme
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                type: initialData.type,
                credits: initialData.credits ?? 10,
                price: initialData.price,
                validityDays: initialData.validityDays,
                allowedDisciplines: initialData.allowedDisciplines || ['PILATES'],
                allowedServices: initialData.allowedServices || ['CLASS'],
            });
        } else {
            setFormData({
                name: '',
                description: '',
                type: 'CREDIT_PACK',
                credits: 10,
                price: 1500,
                validityDays: 30,
                allowedDisciplines: ['PILATES', 'YOGA'],
                allowedServices: ['CLASS'],
            });
        }
    }, [initialData, isOpen]);

    const handleDisciplineToggle = (disc: DisciplineType) => {
        setFormData((prev) => {
            const exists = prev.allowedDisciplines.includes(disc);
            if (exists) {
                return { ...prev, allowedDisciplines: prev.allowedDisciplines.filter((d) => d !== disc) };
            }
            return { ...prev, allowedDisciplines: [...prev.allowedDisciplines, disc] };
        });
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 200);
    };

    if (!isRendered) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.allowedDisciplines.length === 0) {
            setError('En az bir geçerli branş seçmelisiniz.');
            return;
        }

        setIsLoading(true);

        try {
            if (initialData) {
                await packagesApi.updatePackage(initialData.id, formData);
            } else {
                await packagesApi.createPackage(formData);
            }
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Paket kaydedilirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleClose}
        >
            <div
                className={`bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 ease-out transform ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">
                            {initialData ? 'Paket Şablonunu Düzenle' : t.packages.modalTitle}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.packages.packageName} *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ör: 10'lu Aletli Pilates Paketi"
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.packages.selectType} *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as PackageType })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                <option value="CREDIT_PACK">{t.packages.typeCredit}</option>
                                <option value="UNLIMITED">{t.packages.typeUnlimited}</option>
                                <option value="RECURRING_SUBSCRIPTION">{t.packages.typeSubscription}</option>
                            </select>
                        </div>

                        {formData.type === 'CREDIT_PACK' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">{t.packages.creditsCount} *</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={formData.credits || 1}
                                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.packages.price} (₺) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.packages.validityDays} (Gün) *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.validityDays}
                                onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Geçerli Branşlar *</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {(['REFORMER', 'PILATES', 'YOGA', 'DANCE', 'FITNESS_GYM', 'WELLNESS_SPA'] as DisciplineType[]).map(
                                (disc) => {
                                    const isSelected = formData.allowedDisciplines.includes(disc);
                                    return (
                                        <button
                                            key={disc}
                                            type="button"
                                            onClick={() => handleDisciplineToggle(disc)}
                                            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                : 'bg-input border-border text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {disc}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.packages.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.packages.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}