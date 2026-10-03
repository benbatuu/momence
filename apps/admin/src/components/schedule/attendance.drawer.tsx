/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { scheduleApi, ClassSessionDetail, BookingParticipant } from '@/lib/schedule.api';
import { X, CheckCircle2, XCircle, Clock, User, Loader2 } from 'lucide-react';

interface AttendanceDrawerProps {
    session: ClassSessionDetail | null;
    onClose: () => void;
    onRefresh: () => void;
    userRole: string;
}

export function AttendanceDrawer({ session, onClose, onRefresh, userRole }: AttendanceDrawerProps) {
    const [isRendered, setIsRendered] = useState<boolean>(!!session);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

    // Açılış & Kapanış Animasyonu
    useEffect(() => {
        if (session) {
            setIsRendered(true);
            // DOM'a girer girmez render edilip css transition başlatılır
            const timer = setTimeout(() => setIsVisible(true), 15);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            // 300ms kayma süresi bittiğinde DOM'dan temizlenir
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [session]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!isRendered || !session) return null;

    const confirmedBookings = session.bookings?.filter((b) => b.status === 'CONFIRMED') || [];
    const waitlistBookings = session.bookings?.filter((b) => b.status === 'WAITLIST') || [];

    const handleAttendance = async (bookingId: string, status: 'ATTENDED' | 'NO_SHOW') => {
        setUpdatingBookingId(bookingId);
        try {
            await scheduleApi.recordAttendance(bookingId, status);
            onRefresh();
        } catch (err) {
            console.error('Yoklama güncellenemedi:', err);
        } finally {
            setUpdatingBookingId(null);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/50 backdrop-blur-xs flex justify-end transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleClose}
        >
            <div
                className={`bg-card border-l border-border w-full max-w-md h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-primary/10 text-primary border-primary/20">
                            {session.template?.discipline || 'DERSE KATILIM'}
                        </span>
                        <h2 className="font-bold text-foreground text-sm mt-1">{session.title}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Seans Detayı Summary */}
                <div className="p-4 bg-muted/40 border-b border-border space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>
                            {new Date(session.startTime).toLocaleString('tr-TR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>Eğitmen: {session.instructor?.name || 'Atanmadı'}</span>
                    </div>
                </div>

                {/* Katılımcı Listesi */}
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                            <span>Onaylı Katılımcılar ({confirmedBookings.length} / {session.capacity})</span>
                        </h3>

                        {confirmedBookings.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-4 text-center">
                                Henüz bu derse kayıtlı üye bulunmuyor.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {confirmedBookings.map((b: BookingParticipant) => (
                                    <div
                                        key={b.id}
                                        className="p-3 bg-input/50 border border-border rounded-xl flex items-center justify-between gap-2 transition-all hover:bg-input"
                                    >
                                        <div>
                                            <div className="font-semibold text-xs text-foreground">{b.user.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{b.user.email}</div>
                                        </div>

                                        {['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'].includes(userRole) && (
                                            <div className="flex items-center gap-1">
                                                {updatingBookingId === b.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAttendance(b.id, 'ATTENDED')}
                                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${b.attendance?.status === 'ATTENDED'
                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                : 'bg-card border-border hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500'
                                                                }`}
                                                            title="Derse Katıldı"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendance(b.id, 'NO_SHOW')}
                                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${b.attendance?.status === 'NO_SHOW'
                                                                ? 'bg-destructive text-white border-destructive'
                                                                : 'bg-card border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                                                                }`}
                                                            title="Gelmedi (No Show)"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Waitlist Listesi */}
                    {waitlistBookings.length > 0 && (
                        <div className="pt-2 border-t border-border">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
                                Yedek Sıradakiler ({waitlistBookings.length})
                            </h3>
                            <div className="space-y-2">
                                {waitlistBookings.map((b: BookingParticipant, idx: number) => (
                                    <div
                                        key={b.id}
                                        className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs"
                                    >
                                        <span className="font-semibold text-foreground">
                                            #{idx + 1} {b.user.name}
                                        </span>
                                        <span className="text-[10px] text-amber-500 font-bold">Yedek Sırada</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}