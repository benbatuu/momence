'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { appointmentsApi, AppointmentItem } from '@/lib/appointments.api';
import { AppointmentModal } from '@/components/appointments/appointment.modal';
import { AppointmentStats } from '@/components/appointments/appointment.stats';
import {
    Dumbbell,
    Plus,
    Loader2,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    AlertCircle,
    Trash2,
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function AppointmentsPage() {
    const t = useLanguageStore((state) => state.t());
    const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtreler
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const loadAppointments = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await appointmentsApi.getAppointments({
                search: search || undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
            });
            setAppointments(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Randevular yüklenirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAppointments();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadAppointments]);

    // Frontend Fallback Filtreleme
    const filteredAppointments = useMemo(() => {
        return appointments.filter((apt) => {
            const matchesSearch =
                search.trim() === '' ||
                apt.title.toLowerCase().includes(search.toLowerCase()) ||
                apt.client?.name.toLowerCase().includes(search.toLowerCase()) ||
                apt.instructor?.name.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [appointments, search, statusFilter]);

    // Durum Güncelleme Aksiyonu
    const handleStatusChange = async (id: string, newStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
        try {
            await appointmentsApi.updateAppointmentStatus(id, newStatus);
            loadAppointments();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Durum güncellenemedi.');
            }
        }
    };

    // Silme Aksiyonu
    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`"${title}" randevusunu silmek istediğinize emin misiniz?`)) return;

        try {
            await appointmentsApi.deleteAppointment(id);
            loadAppointments();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Randevu silinemedi.');
            }
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-primary" />
                        {t.appointments.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.appointments.subtitle}</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.appointments.createButton}
                </button>
            </div>

            {/* İstatistik Bandı */}
            <AppointmentStats appointments={filteredAppointments} />

            {/* Arama & Filtre Barı */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Seans, danışan veya eğitmen adı ile ara..."
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="CONFIRMED">Onaylı</option>
                        <option value="PENDING">Beklemede</option>
                        <option value="COMPLETED">Tamamlanan</option>
                        <option value="CANCELLED">İptal Edilen</option>
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

            {/* Randevu Liste Kartları */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Randevular yükleniyor...
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                    {t.appointments.noAppointments}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments.map((apt) => (
                        <div
                            key={apt.id}
                            className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-primary/10 text-primary border-primary/20">
                                            Özel Seans
                                        </span>
                                        <h3 className="font-bold text-sm text-foreground mt-1">{apt.title}</h3>
                                    </div>

                                    {apt.status === 'CONFIRMED' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Onaylı
                                        </span>
                                    )}
                                    {apt.status === 'COMPLETED' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                                        </span>
                                    )}
                                    {apt.status === 'CANCELLED' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1">
                                            <XCircle className="w-3 h-3" /> İptal
                                        </span>
                                    )}
                                    {apt.status === 'PENDING' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/10 text-amber-500 border-amber-500/20">
                                            Bekliyor
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>
                                            Danışan: <strong className="text-foreground">{apt.client?.name || 'Belirtilmedi'}</strong>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>
                                            {apt.date} ({apt.startTime} - {apt.endTime || '50 Dk'})
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-muted-foreground">{apt.roomName || 'Ana Kabin'}</span>
                                        <span className="font-bold text-foreground text-sm">₺{apt.price}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Aksiyon Butonları */}
                            <div className="pt-3 border-t border-border flex items-center justify-end gap-1.5">
                                {apt.status === 'CONFIRMED' && (
                                    <button
                                        onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all cursor-pointer"
                                    >
                                        Tamamlandı
                                    </button>
                                )}
                                {apt.status !== 'CANCELLED' && (
                                    <button
                                        onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-all cursor-pointer"
                                    >
                                        İptal Et
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(apt.id, apt.title)}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title="Sil"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadAppointments}
            />
        </div>
    );
}