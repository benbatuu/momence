/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { appointmentsApi, AppointmentUserOption, CreateAppointmentPayload } from '@/lib/appointments.api';
import { X, Loader2, Dumbbell, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AppointmentModal({ isOpen, onClose, onSuccess }: AppointmentModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [clients, setClients] = useState<AppointmentUserOption[]>([]);
    const [instructors, setInstructors] = useState<AppointmentUserOption[]>([]);

    const [formData, setFormData] = useState<CreateAppointmentPayload>({
        title: '1-on-1 Aletli Pilates Seansı',
        clientId: '',
        instructorId: '',
        roomName: 'Özel Seans Odası 1',
        date: new Date().toISOString().split('T')[0],
        startTime: '11:00',
        durationMinutes: 50,
        price: 1200,
        notes: 'Kişiye özel omurga hizalama çalışması.',
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

    // Danışan ve Eğitmen Verilerini Canlı Yükle
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        Promise.all([
            appointmentsApi.getClients().catch(() => []),
            appointmentsApi.getInstructors().catch(() => []),
        ]).then(([clientData, instData]) => {
            if (!isMounted) return;
            setClients(clientData);
            setInstructors(instData);

            if (clientData.length > 0) setFormData((prev) => ({ ...prev, clientId: clientData[0].id }));
            if (instData.length > 0) setFormData((prev) => ({ ...prev, instructorId: instData[0].id }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.clientId || !formData.instructorId) {
            setError('Lütfen danışan ve eğitmen seçimlerini tamamlayın.');
            return;
        }

        setIsLoading(true);

        try {
            await appointmentsApi.createAppointment(formData);
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Randevu oluşturulurken hata oluştu.');
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
                        <h2 className="font-bold text-foreground text-sm">{t.appointments.modalTitle}</h2>
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
                        <label className="text-xs font-medium text-foreground">{t.appointments.serviceName} *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.appointments.selectClient} *</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                {clients.length === 0 ? (
                                    <option value="">Danışan bulunamadı</option>
                                ) : (
                                    clients.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.email})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.appointments.selectInstructor} *</label>
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.appointments.date} *</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.appointments.time} *</label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.appointments.price} (₺) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.appointments.room}</label>
                        <input
                            type="text"
                            value={formData.roomName}
                            onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.appointments.notes}</label>
                        <textarea
                            rows={2}
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.appointments.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.appointments.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}