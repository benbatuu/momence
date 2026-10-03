/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { workshopsApi, WorkshopInstructorOption, CreateWorkshopPayload } from '@/lib/workshops.api';
import { X, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface WorkshopModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function WorkshopModal({ isOpen, onClose, onSuccess }: WorkshopModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [instructors, setInstructors] = useState<WorkshopInstructorOption[]>([]);

    const todayStr = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState<CreateWorkshopPayload>({
        title: 'Hafta Sonu Nefes & Sound Bath Atölyesi',
        description: 'Beden zihin hizalaması ve ses çanakları eşliğinde derin gevşeme seansı.',
        eventType: 'WORKSHOP',
        discipline: 'YOGA',
        instructorId: '',
        roomName: 'Büyük Yoga Salonu',
        startDate: todayStr,
        endDate: todayStr,
        startTime: '13:00',
        endTime: '16:00',
        price: 1500,
        capacity: 20,
        isOnline: false,
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

    // Eğitmen Listesini Canlı Yükle
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        workshopsApi
            .getInstructors()
            .then((instData) => {
                if (!isMounted) return;
                setInstructors(instData);
                if (instData.length > 0) {
                    setFormData((prev) => ({ ...prev, instructorId: instData[0].id }));
                }
            })
            .catch(() => null);

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

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

        if (!formData.instructorId) {
            setError('Lütfen atölye için bir eğitmen seçin.');
            return;
        }

        setIsLoading(true);

        try {
            await workshopsApi.createWorkshop(formData);
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Atölye oluşturulurken bir hata oluştu.');
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
                        <h2 className="font-bold text-foreground text-sm">{t.workshops.modalTitle}</h2>
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
                        <label className="text-xs font-medium text-foreground">{t.workshops.workshopTitle} *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Açıklama</label>
                        <textarea
                            rows={2}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.workshops.eventType}</label>
                            <select
                                value={formData.eventType}
                                onChange={(e) =>
                                    setFormData({ ...formData, eventType: e.target.value as CreateWorkshopPayload['eventType'] })
                                }
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                <option value="WORKSHOP">Atölye (Workshop)</option>
                                <option value="MASTERCLASS">Masterclass</option>
                                <option value="RETREAT">Kamp (Retreat)</option>
                                <option value="CERTIFICATION">Sertifika Programı</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.workshops.discipline}</label>
                            <select
                                value={formData.discipline}
                                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                <option value="YOGA">Yoga</option>
                                <option value="PILATES">Pilates</option>
                                <option value="DANCE">Dans</option>
                                <option value="WELLNESS_SPA">Wellness / Terapi</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.workshops.instructor} *</label>
                            <select
                                required
                                value={formData.instructorId}
                                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                {instructors.length === 0 ? (
                                    <option value="">Eğitmen bulunamadı</option>
                                ) : (
                                    instructors.map((inst) => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Salon / Konum</label>
                            <input
                                type="text"
                                required
                                value={formData.roomName}
                                onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Başlangıç - Bitiş Tarihi</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-input border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-input border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Saat Aralığı</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full bg-input border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full bg-input border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.workshops.price} (₺) *</label>
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
                            <label className="text-xs font-medium text-foreground">{t.workshops.capacity} *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
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
                            {t.workshops.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.workshops.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}