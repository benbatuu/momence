/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { classesApi, ClassDefinitionItem, CreateClassPayload, DisciplineType } from '@/lib/classes.api';
import type { ClassLevel } from '@/types/class.types';
import { X, Loader2, Dumbbell, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ClassDefinitionItem | null;
}

export function ClassModal({ isOpen, onClose, onSuccess, initialData }: ClassModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [formData, setFormData] = useState<CreateClassPayload>({
        title: '',
        description: '',
        discipline: 'REFORMER',
        durationMin: 50,
        maxCapacity: 8,
        level: 'INTERMEDIATE',
        colorHex: '#10B981',
    });

    // Animasyon Yönetimi
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

    // Initial Data Değiştiğinde Formu Doldur
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description || '',
                discipline: initialData.discipline,
                durationMin: initialData.durationMin,
                maxCapacity: initialData.maxCapacity,
                level: initialData.level,
                colorHex: initialData.colorHex || '#10B981',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                discipline: 'REFORMER',
                durationMin: 50,
                maxCapacity: 8,
                level: 'INTERMEDIATE',
                colorHex: '#10B981',
            });
        }
    }, [initialData, isOpen]);

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
        setIsLoading(true);

        try {
            if (initialData) {
                await classesApi.updateClass(initialData.id, formData);
            } else {
                await classesApi.createClass(formData);
            }
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'İşlem gerçekleştirilirken bir hata oluştu.');
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
                            <Dumbbell className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">
                            {initialData ? 'Ders Şablonunu Düzenle' : t.classes.modalTitle}
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
                        <label className="text-xs font-medium text-foreground">{t.classes.className} *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="ör: Reformer Flow Level 2"
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Açıklama</label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ders içeriği ve kazanımları..."
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.classes.discipline}</label>
                            <select
                                value={formData.discipline}
                                onChange={(e) => setFormData({ ...formData, discipline: e.target.value as DisciplineType })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                <option value="REFORMER">Reformer Pilates</option>
                                <option value="PILATES">Mat Pilates</option>
                                <option value="YOGA">Yoga</option>
                                <option value="DANCE">Dans</option>
                                <option value="FITNESS_GYM">Fitness / Gym</option>
                                <option value="WELLNESS_SPA">Wellness / Spa</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.classes.level}</label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value as ClassLevel })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                <option value="ALL_LEVELS">{t.classes.levelAll}</option>
                                <option value="BEGINNER">{t.classes.levelBeginner}</option>
                                <option value="INTERMEDIATE">{t.classes.levelIntermediate}</option>
                                <option value="ADVANCED">{t.classes.levelAdvanced}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.classes.duration} (dk) *</label>
                            <input
                                type="number"
                                required
                                min={15}
                                step={5}
                                value={formData.durationMin}
                                onChange={(e) => setFormData({ ...formData, durationMin: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Maksimum Kapasite *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.maxCapacity}
                                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.classes.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.classes.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}