/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { instructorsApi, InstructorProfile, CreateInstructorPayload } from '@/lib/instructors.api';
import type { DisciplineType } from '@/types/studio.types';
import { X, Loader2, Award, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface InstructorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: InstructorProfile | null;
}

export function InstructorModal({ isOpen, onClose, onSuccess, initialData }: InstructorModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [formData, setFormData] = useState<CreateInstructorPayload>({
        name: '',
        email: '',
        phone: '',
        bio: 'Mat/Reformer Pilates ve Vinyasa Yoga uzmanı.',
        specialties: ['PILATES', 'YOGA'],
        hourlyRate: 500,
    });

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

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.user?.name || '',
                email: initialData.user?.email || '',
                phone: initialData.user?.phone || '',
                bio: initialData.bio || '',
                specialties: initialData.specialties || ['PILATES'],
                hourlyRate: initialData.hourlyRate || 500,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                bio: 'Mat/Reformer Pilates ve Vinyasa Yoga uzmanı.',
                specialties: ['PILATES', 'YOGA'],
                hourlyRate: 500,
            });
        }
    }, [initialData, isOpen]);

    const handleSpecialtyChange = (discipline: DisciplineType) => {
        setFormData((prev) => {
            const exists = prev.specialties.includes(discipline);
            if (exists) {
                return { ...prev, specialties: prev.specialties.filter((s) => s !== discipline) };
            }
            return { ...prev, specialties: [...prev.specialties, discipline] };
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

        if (formData.specialties.length === 0) {
            setError('En az bir uzmanlık alanı seçmelisiniz.');
            return;
        }

        setIsLoading(true);

        try {
            if (initialData) {
                await instructorsApi.updateInstructor(initialData.id, formData);
            } else {
                await instructorsApi.createInstructor(formData);
            }
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Eğitmen kaydedilirken bir hata oluştu.');
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
                            <Award className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">
                            {initialData ? 'Eğitmen Profilini Düzenle' : t.instructors.modalTitle}
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
                        <label className="text-xs font-medium text-foreground">{t.instructors.fullName} *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ör: Selin Yılmaz"
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.instructors.email} *</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="selin@ompilates.com"
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.instructors.phone}</label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="0532 123 45 67"
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">{t.instructors.specialties} *</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {(['REFORMER', 'PILATES', 'YOGA', 'DANCE', 'FITNESS_GYM', 'WELLNESS_SPA'] as DisciplineType[]).map(
                                (disc) => {
                                    const isSelected = formData.specialties.includes(disc);
                                    return (
                                        <button
                                            key={disc}
                                            type="button"
                                            onClick={() => handleSpecialtyChange(disc)}
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

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.instructors.hourlyRate} (₺) *</label>
                        <input
                            type="number"
                            required
                            min={0}
                            value={formData.hourlyRate || 0}
                            onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.instructors.bio}</label>
                        <textarea
                            rows={2}
                            value={formData.bio || ''}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.instructors.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.instructors.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}