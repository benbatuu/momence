'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { videosApi, OnDemandVideo } from '@/lib/videos.api';
import { OnDemandModal } from '@/components/ondemand/ondemand.modal';
import { OnDemandStats } from '@/components/ondemand/ondemand.stats';
import { OnDemandDrawer } from '@/components/ondemand/ondemand.drawer';
import {
    Video,
    Plus,
    Loader2,
    Clock,
    Lock,
    Search,
    Play,
    Filter,
    AlertCircle,
    Trash2,
    Edit2,
    MoreVertical,
    CheckCircle2,
} from 'lucide-react';
import { AxiosError } from 'axios';
import Image from 'next/image';

export default function OnDemandPage() {
    const t = useLanguageStore((state) => state.t());
    const [videos, setVideos] = useState<OnDemandVideo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtreler
    const [search, setSearch] = useState<string>('');
    const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');

    // Modallar ve Drawer
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedVideoForEdit, setSelectedVideoForEdit] = useState<OnDemandVideo | null>(null);
    const [selectedVideoIdForDrawer, setSelectedVideoIdForDrawer] = useState<string | null>(null);

    // Aksiyon Popover State
    const [activeMenuVideoId, setActiveMenuVideoId] = useState<string | null>(null);

    const loadVideos = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await videosApi.getVideos({
                discipline: disciplineFilter !== 'ALL' ? disciplineFilter : undefined,
            });
            setVideos(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Videolar yüklenirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [disciplineFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadVideos();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadVideos]);

    // Frontend Fallback Filtreleme
    const filteredVideos = useMemo(() => {
        return videos.filter((v) => {
            const matchesSearch =
                search.trim() === '' ||
                v.title.toLowerCase().includes(search.toLowerCase()) ||
                (v.description && v.description.toLowerCase().includes(search.toLowerCase())) ||
                (v.studio?.name && v.studio.name.toLowerCase().includes(search.toLowerCase()));

            const matchesDiscipline =
                disciplineFilter === 'ALL' || v.discipline === disciplineFilter;

            return matchesSearch && matchesDiscipline;
        });
    }, [videos, search, disciplineFilter]);

    // Silme Aksiyonu
    const handleDelete = async (id: string, title: string) => {
        setActiveMenuVideoId(null);
        if (!window.confirm(`"${title}" videosunu silmek istediğinize emin misiniz?`)) return;

        try {
            await videosApi.deleteVideo(id);
            loadVideos();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Video silinemedi.');
            }
        }
    };

    const handleEditClick = (v: OnDemandVideo) => {
        setActiveMenuVideoId(null);
        setSelectedVideoForEdit(v);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedVideoForEdit(null);
    };

    // Saniye değerini Dakikaya çevirme yardımcısı
    const formatSecToMin = (sec: number = 0) => {
        return Math.round(sec / 60);
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Video className="w-6 h-6 text-primary" />
                        {t.ondemand.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.ondemand.subtitle}</p>
                </div>

                <button
                    onClick={() => {
                        setSelectedVideoForEdit(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.ondemand.createButton}
                </button>
            </div>

            {/* İstatistik Bandı */}
            <OnDemandStats videos={filteredVideos} />

            {/* Arama & Filtre Barı */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.ondemand.searchPlaceholder}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={disciplineFilter}
                        onChange={(e) => setDisciplineFilter(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        <option value="ALL">Tüm Branşlar</option>
                        <option value="REFORMER">Reformer Pilates</option>
                        <option value="PILATES">Mat Pilates</option>
                        <option value="YOGA">Yoga</option>
                        <option value="FITNESS">Fitness</option>
                        <option value="BARRE">Barre</option>
                        <option value="OTHER">Diğer</option>
                    </select>
                </div>
            </div>

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Grid Liste */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Videolar yükleniyor...
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                    {t.ondemand.noVideos}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideos.map((v) => (
                        <div
                            key={v.id}
                            className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/50 transition-all space-y-4 group flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                {/* Oynatıcı Kartı */}
                                <div
                                    onClick={() => setSelectedVideoIdForDrawer(v.id)}
                                    className="relative h-36 bg-input rounded-xl border border-border flex items-center justify-center overflow-hidden cursor-pointer"
                                >
                                    {v.thumbnailUrl ? (
                                        <Image
                                            src={v.thumbnailUrl}
                                            alt={v.title}
                                            width={400}
                                            height={225}
                                            unoptimized
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : null}
                                    <div className="absolute p-3 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform backdrop-blur-xs">
                                        <Play className="w-6 h-6 fill-primary" />
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        {v.isRequiredPackage ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 backdrop-blur-md">
                                                <Lock className="w-3 h-3" /> Paket Gerekli
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 backdrop-blur-md">
                                                Herkese Açık
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase bg-primary/10 text-primary border-primary/20">
                                            {v.discipline}
                                        </span>
                                        {v.studio?.name && (
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                {v.studio.name}
                                            </span>
                                        )}
                                    </div>

                                    <h3
                                        onClick={() => setSelectedVideoIdForDrawer(v.id)}
                                        className="font-bold text-sm text-foreground mt-2 hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {v.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {v.description || 'Açıklama bulunmuyor.'}
                                    </p>
                                </div>
                            </div>

                            {/* Alt Metrikler ve Aksiyonlar */}
                            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-primary" /> {formatSecToMin(v.durationSec)} Dk
                                    </span>
                                    {v.isActive ? (
                                        <span className="text-emerald-500 inline-flex items-center gap-1 font-medium text-[11px]">
                                            <CheckCircle2 className="w-3 h-3" /> Aktif
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-[11px]">Pasif</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 relative">
                                    <button
                                        onClick={() => handleEditClick(v)}
                                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() =>
                                                setActiveMenuVideoId(activeMenuVideoId === v.id ? null : v.id)
                                            }
                                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                        </button>

                                        {activeMenuVideoId === v.id && (
                                            <div className="absolute right-0 bottom-8 w-40 bg-card border border-border rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    onClick={() => handleDelete(v.id, v.title)}
                                                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Videoyu Sil
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <OnDemandModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={loadVideos}
                initialData={selectedVideoForEdit}
            />

            {/* Video Önizleme & Detay Drawer */}
            <OnDemandDrawer
                videoId={selectedVideoIdForDrawer}
                onClose={() => setSelectedVideoIdForDrawer(null)}
                onRefresh={loadVideos}
            />
        </div>
    );
}