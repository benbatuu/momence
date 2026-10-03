'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { useAuthStore } from '@/lib/auth.store';
import { scheduleApi, ClassSessionDetail } from '@/lib/schedule.api';
import { ScheduleModal } from '@/components/schedule/schedule.modal';
import { ScheduleStats } from '@/components/schedule/schedule.stats';
import { AttendanceDrawer } from '@/components/schedule/attendance.drawer';
import { DateRangePicker } from '@/components/schedule/date.range.picker';
import {
    CalendarDays,
    Plus,
    Loader2,
    Clock,
    Users,
    User,
    MapPin,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function SchedulePage() {
    const t = useLanguageStore((state) => state.t());
    const { user } = useAuthStore();
    const role = user?.role || 'CLIENT';

    const [sessions, setSessions] = useState<ClassSessionDetail[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [bookingLoadingId, setBookingLoadingId] = useState<string | null>(null);

    // Çift Tarih State'i (Lazy Initializer ile React Rule Uyumlu)
    const [startDate, setStartDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 6);
        return d.toISOString().split('T')[0];
    });

    // Modallar
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeSessionForDrawer, setActiveSessionForDrawer] = useState<ClassSessionDetail | null>(null);

    const loadSchedule = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await scheduleApi.getSessions(startDate, endDate);
            setSessions(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Ders takvimi yüklenirken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const fetchSchedule = async () => {
            await loadSchedule();
        };
        fetchSchedule();
    }, [loadSchedule]);

    const handleDateRangeChange = (newStart: string, newEnd: string) => {
        setStartDate(newStart);
        setEndDate(newEnd);
    };

    // Derse Katıl / Rezervasyon Yap (CLIENT)
    const handleBookSession = async (sessionId: string) => {
        setBookingLoadingId(sessionId);
        try {
            await scheduleApi.bookSession(sessionId);
            alert('Derse kaydınız başarıyla yapıldı!');
            loadSchedule();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Derse kayıt yapılamadı.');
            }
        } finally {
            setBookingLoadingId(null);
        }
    };

    // Seansı İptal Et (ADMIN)
    const handleCancelSession = async (session: ClassSessionDetail) => {
        if (!window.confirm(`"${session.title}" ders seansını iptal etmek istediğinize emin misiniz?`)) return;

        try {
            await scheduleApi.cancelSession(session.id, 'Admin talebiyle iptal edildi.');
            loadSchedule();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Seans iptal edilemedi.');
            }
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Sayfa Başlığı ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-primary" />
                        {t.schedule.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.schedule.subtitle}</p>
                </div>

                {['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'].includes(role) && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        {t.schedule.createButton}
                    </button>
                )}
            </div>

            {/* Günlük / Aralıklı İstatistik Özeti */}
            <ScheduleStats sessions={sessions} />

            {/* Çift Tarih Aralığı Seçim Barı (DateRangePicker) */}
            <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateRangeChange}
            />

            {/* Hata Mesajı */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Seans Kartları */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Canlı dersler yükleniyor...
                </div>
            ) : sessions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                    Seçilen tarih aralığında planlanmış canlı ders seansı bulunmuyor.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((s) => {
                        const confirmedCount = s.bookings?.filter((b) => b.status === 'CONFIRMED').length || s._count?.bookings || 0;
                        const isFull = confirmedCount >= s.capacity;
                        const isCancelled = s.status === 'CANCELLED';

                        return (
                            <div
                                key={s.id}
                                className={`bg-card border rounded-2xl p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between ${isCancelled ? 'opacity-60 border-destructive/30' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-primary/10 text-primary border-primary/20">
                                                {s.template?.discipline || 'PILATES'}
                                            </span>
                                            <h3 className="font-bold text-sm text-foreground mt-2">{s.title}</h3>
                                        </div>

                                        {isCancelled ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-destructive/10 text-destructive border-destructive/20">
                                                İPTAL EDİLDİ
                                            </span>
                                        ) : (
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${isFull
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    }`}
                                            >
                                                {isFull ? 'Dolu / Yedek Alıyor' : 'Müsait'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span>
                                                {new Date(s.startTime).toLocaleString('tr-TR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span>{s.instructor?.name || 'Eğitmen Atanmadı'}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span>{s.location || 'Ana Stüdyo'}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span>
                                                {confirmedCount} / {s.capacity} Katılımcı
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Aksiyon Butonları */}
                                {!isCancelled && (
                                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                                        {role === 'CLIENT' ? (
                                            <button
                                                disabled={bookingLoadingId === s.id}
                                                onClick={() => handleBookSession(s.id)}
                                                className="w-full py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                {bookingLoadingId === s.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : isFull ? (
                                                    'Yedek Sıraya Gir'
                                                ) : (
                                                    'Derse Kaydol'
                                                )}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setActiveSessionForDrawer(s)}
                                                    className="flex-1 py-1.5 bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    <Users className="w-3.5 h-3.5" /> Katılımcılar ({confirmedCount})
                                                </button>
                                                {['SUPER_ADMIN', 'ADMIN'].includes(role) && (
                                                    <button
                                                        onClick={() => handleCancelSession(s)}
                                                        className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-xl transition-all cursor-pointer"
                                                        title="Seansı İptal Et"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Seans Oluşturma Modalı */}
            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadSchedule}
                defaultDate={startDate}
            />

            {/* Katılımcı & Yoklama Çekmecesi */}
            <AttendanceDrawer
                session={activeSessionForDrawer}
                onClose={() => setActiveSessionForDrawer(null)}
                onRefresh={loadSchedule}
                userRole={role}
            />
        </div>
    );
}