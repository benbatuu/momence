/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { instructorsApi, InstructorProfile } from '@/lib/instructors.api';
import {
    X,
    Award,
    Mail,
    Phone,
    Calendar,
    Users,
    Clock,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

interface InstructorDetailDrawerProps {
    instructorId: string | null;
    onClose: () => void;
    onRefresh: () => void;
}

export function InstructorDetailDrawer({ instructorId, onClose, onRefresh }: InstructorDetailDrawerProps) {
    const [isRendered, setIsRendered] = useState<boolean>(!!instructorId);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Animasyon Yönetimi
    useEffect(() => {
        if (instructorId) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsVisible(true), 15);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [instructorId]);

    // Canlı Veri Çekimi
    useEffect(() => {
        if (!instructorId) return;

        let isMounted = true;
        setIsLoading(true);

        instructorsApi
            .getInstructorById(instructorId)
            .then((data) => {
                if (isMounted) setInstructor(data);
            })
            .catch(() => {
                if (isMounted) setInstructor(null);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [instructorId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleToggleStatus = async () => {
        if (!instructor) return;
        try {
            await instructorsApi.updateInstructor(instructor.id, { isActive: !instructor.isActive });
            setInstructor((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
            onRefresh();
        } catch (err) {
            console.error('Eğitmen durumu değiştirilemedi:', err);
        }
    };

    if (!isRendered || !instructorId) return null;

    return (
        <div
            className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex justify-end transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleClose}
        >
            <div
                className={`bg-card border-l border-border w-full max-w-xl h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                            {instructor?.user?.name ? instructor.user.name.charAt(0).toUpperCase() : <Award className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground text-base leading-tight">
                                {instructor?.user?.name || 'Eğitmen Detayı'}
                            </h2>
                            <p className="text-xs text-muted-foreground">{instructor?.user?.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {instructor && (
                            <button
                                onClick={handleToggleStatus}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${instructor.isActive
                                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                    }`}
                            >
                                {instructor.isActive ? 'Aktif Eğitmen' : 'Pasif Eğitmen'}
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* İçerik */}
                {isLoading ? (
                    <div className="p-12 flex-1 flex justify-center items-center text-xs text-muted-foreground gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Eğitmen detayları yükleniyor...
                    </div>
                ) : !instructor ? (
                    <div className="p-12 flex-1 text-center text-xs text-muted-foreground">Eğitmen detayı bulunamadı.</div>
                ) : (
                    <div className="p-5 overflow-y-auto flex-1 space-y-5">
                        {/* Hakediş & İstatistik Kartları */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                <span className="text-[10px] text-muted-foreground block font-medium">Bu Ayki Hakediş</span>
                                <span className="text-sm font-bold text-primary">₺{instructor.stats?.monthlyEarnings || 0}</span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                <span className="text-[10px] text-muted-foreground block font-medium">Toplam Verilen Seans</span>
                                <span className="text-sm font-bold text-foreground">
                                    {instructor.stats?.totalSessionsCount || 0} Ders
                                </span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border col-span-2 sm:col-span-1">
                                <span className="text-[10px] text-muted-foreground block font-medium">Seans Başı Ücret</span>
                                <span className="text-sm font-bold text-foreground">₺{instructor.hourlyRate}</span>
                            </div>
                        </div>

                        {/* İletişim & Biyografi */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">İletişim & Profil</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-muted-foreground">E-Posta:</span>
                                    <strong className="text-foreground">{instructor.user?.email}</strong>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-muted-foreground">Telefon:</span>
                                    <strong className="text-foreground">{instructor.user?.phone || 'Belirtilmedi'}</strong>
                                </div>
                            </div>

                            {instructor.bio && (
                                <div className="pt-2 border-t border-border">
                                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Biyografi / Deneyim</span>
                                    <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-xl">
                                        {instructor.bio}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Uzmanlık Alanları */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Uzmanlık Branşları</h3>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {instructor.specialties.map((s) => (
                                    <span
                                        key={s}
                                        className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase bg-primary/10 text-primary border border-primary/20"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Tamamlanan Son Seanslar */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Son Tamamlanan Seanslar</h3>
                            {!instructor.recentSessions || instructor.recentSessions.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground italic border border-border rounded-2xl">
                                    Henüz verilmiş seans kaydı bulunmuyor.
                                </div>
                            ) : (
                                instructor.recentSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="p-3 bg-card border border-border rounded-2xl flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <div className="font-bold text-foreground">{session.title}</div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-primary" /> {session.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-primary" /> {session.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-primary" /> {session.participantCount} Kişi
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-emerald-500 block text-sm">₺{session.earnings}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tamamlandı
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}