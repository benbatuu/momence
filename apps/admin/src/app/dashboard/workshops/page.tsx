'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { workshopsApi, WorkshopItem } from '@/lib/workshops.api';
import { WorkshopModal } from '@/components/workshops/workshop.modal';
import { WorkshopStats } from '@/components/workshops/workshop.stats';
import {
    Sparkles,
    Plus,
    Loader2,
    Users,
    User,
    Calendar,
    MapPin,
    Search,
    Filter,
    AlertCircle,
    Trash2,
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function WorkshopsPage() {
    const t = useLanguageStore((state) => state.t());
    const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtreler
    const [search, setSearch] = useState<string>('');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const loadWorkshops = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await workshopsApi.getWorkshops({
                search: search || undefined,
                eventType: eventTypeFilter !== 'ALL' ? eventTypeFilter : undefined,
            });
            setWorkshops(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Atölyeler yüklenirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, eventTypeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadWorkshops();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadWorkshops]);

    // Frontend Fallback Filtreleme
    const filteredWorkshops = useMemo(() => {
        return workshops.filter((ws) => {
            const matchesSearch =
                search.trim() === '' ||
                ws.title.toLowerCase().includes(search.toLowerCase()) ||
                ws.description?.toLowerCase().includes(search.toLowerCase()) ||
                ws.instructor?.name.toLowerCase().includes(search.toLowerCase());

            const matchesType = eventTypeFilter === 'ALL' || ws.eventType === eventTypeFilter;

            return matchesSearch && matchesType;
        });
    }, [workshops, search, eventTypeFilter]);

    // Silme Aksiyonu
    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`"${title}" atölyesini silmek istediğinize emin misiniz?`)) return;

        try {
            await workshopsApi.deleteWorkshop(id);
            loadWorkshops();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Atölye silinemedi.');
            }
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        {t.workshops.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.workshops.subtitle}</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.workshops.createButton}
                </button>
            </div>

            {/* İstatistik Bandı */}
            <WorkshopStats workshops={filteredWorkshops} />

            {/* Arama & Filtre Barı */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Atölye, etkinlik veya eğitmen adı ile ara..."
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={eventTypeFilter}
                        onChange={(e) => setEventTypeFilter(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        <option value="ALL">Tüm Etkinlikler</option>
                        <option value="WORKSHOP">Atölye (Workshop)</option>
                        <option value="MASTERCLASS">Masterclass</option>
                        <option value="RETREAT">Kamp (Retreat)</option>
                        <option value="CERTIFICATION">Sertifika Programı</option>
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

            {/* Grid Liste */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Atölyeler yükleniyor...
                </div>
            ) : filteredWorkshops.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                    {t.workshops.noWorkshops}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkshops.map((ws) => (
                        <div
                            key={ws.id}
                            className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-primary/10 text-primary border-primary/20">
                                            {ws.eventType}
                                        </span>
                                        <h3 className="font-bold text-sm text-foreground mt-2">{ws.title}</h3>
                                    </div>
                                    <span className="font-extrabold text-foreground text-sm">₺{ws.price}</span>
                                </div>

                                {ws.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{ws.description}</p>
                                )}

                                <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>
                                            {ws.startDate} ({ws.startTime} - {ws.endTime})
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>{ws.instructor?.name || 'Eğitmen'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>{ws.roomName || 'Ana Salon'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>
                                            {ws.bookedCount || 0} / {ws.capacity} Katılımcı
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Aksiyon Butonları */}
                            <div className="pt-3 border-t border-border flex items-center justify-end">
                                <button
                                    onClick={() => handleDelete(ws.id, ws.title)}
                                    className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                    title="Atölyeyi Sil"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <WorkshopModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadWorkshops}
            />
        </div>
    );
}