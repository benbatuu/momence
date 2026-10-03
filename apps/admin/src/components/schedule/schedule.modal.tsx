/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { scheduleApi, ClassTemplateOption, InstructorOption } from '@/lib/schedule.api';
import { X, Loader2, CalendarDays, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultDate: string;
}

export function ScheduleModal({ isOpen, onClose, onSuccess, defaultDate }: ScheduleModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [templates, setTemplates] = useState<ClassTemplateOption[]>([]);
    const [instructors, setInstructors] = useState<InstructorOption[]>([]);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [instructorId, setInstructorId] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [location, setLocation] = useState<string>('Ana Stüdyo');
    const [sessionDate, setSessionDate] = useState<string>(defaultDate);
    const [startTimeStr, setStartTimeStr] = useState<string>('10:00');
    const [durationMin, setDurationMin] = useState<number>(50);
    const [capacity, setCapacity] = useState<number>(8);

    // Açılış ve Kapanış Animasyonu Yönetimi
    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // DOM'a eklendikten 10ms sonra css transition tetiklenir
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            // 200ms transition tamamlandıktan sonra DOM'dan kaldırılır
            const timer = setTimeout(() => setIsRendered(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Seans Tarihi Değişimi
    useEffect(() => {
        if (isOpen) {
            setSessionDate(defaultDate);
        }
    }, [defaultDate, isOpen]);

    // Şablon ve Eğitmen Verilerini Yükle
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        Promise.all([
            scheduleApi.getTemplates().catch(() => []),
            scheduleApi.getInstructors().catch(() => []),
        ])
            .then(([tmplData, instData]) => {
                if (!isMounted) return;

                const safeTemplates = Array.isArray(tmplData) ? tmplData : [];
                const safeInstructors = Array.isArray(instData) ? instData : [];

                setTemplates(safeTemplates);
                setInstructors(safeInstructors);

                if (safeTemplates.length > 0) {
                    setSelectedTemplateId(safeTemplates[0].id);
                    setTitle(safeTemplates[0].title);
                    setCapacity(safeTemplates[0].maxCapacity);
                    setDurationMin(safeTemplates[0].durationMin);
                }

                if (safeInstructors.length > 0) {
                    setInstructorId(safeInstructors[0].id);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setTemplates([]);
                    setInstructors([]);
                }
            });

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

    const handleTemplateChange = (tmplId: string) => {
        setSelectedTemplateId(tmplId);
        const tmpl = templates.find((t) => t.id === tmplId);
        if (tmpl) {
            setTitle(tmpl.title);
            setCapacity(tmpl.maxCapacity);
            setDurationMin(tmpl.durationMin);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!instructorId) {
            setError('Lütfen seans için bir eğitmen seçin.');
            return;
        }

        setIsLoading(true);

        try {
            const startDateTime = new Date(`${sessionDate}T${startTimeStr}:00`);
            const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);

            await scheduleApi.createSession({
                templateId: selectedTemplateId || undefined,
                instructorId,
                title,
                location,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                capacity,
                lateCancelHours: 12,
            });

            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Seans oluşturulurken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <CalendarDays className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">{t.schedule.modalTitle}</h2>
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
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Ders Şablonu Seçin</label>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        >
                            {(templates || []).map((tmpl) => (
                                <option key={tmpl.id} value={tmpl.id}>
                                    {tmpl.title} ({tmpl.discipline}) - {tmpl.durationMin} dk
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Seans Başlığı *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Eğitmen *</label>
                            <select
                                required
                                value={instructorId}
                                onChange={(e) => setInstructorId(e.target.value)}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                {(instructors || []).length === 0 ? (
                                    <option value="">Eğitmen bulunamadı</option>
                                ) : (
                                    (instructors || []).map((inst) => (
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
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="ör: Reformer Studio A"
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Tarih *</label>
                            <input
                                type="date"
                                required
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Saat *</label>
                            <input
                                type="time"
                                required
                                value={startTimeStr}
                                onChange={(e) => setStartTimeStr(e.target.value)}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Kapasite *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.schedule.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.schedule.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}