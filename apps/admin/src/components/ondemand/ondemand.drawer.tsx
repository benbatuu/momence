/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { videosApi, OnDemandVideo } from '@/lib/videos.api';
import { X, Video, Play, Clock, Building2, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface OnDemandDrawerProps {
    videoId: string | null;
    onClose: () => void;
    onRefresh: () => void;
}

export function OnDemandDrawer({ videoId, onClose, onRefresh }: OnDemandDrawerProps) {
    const [isRendered, setIsRendered] = useState<boolean>(!!videoId);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [video, setVideo] = useState<OnDemandVideo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (videoId) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsVisible(true), 15);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [videoId]);

    useEffect(() => {
        if (!videoId) return;

        let isMounted = true;
        setIsLoading(true);

        videosApi
            .getVideoById(videoId)
            .then((data) => {
                if (isMounted) setVideo(data);
            })
            .catch(() => {
                if (isMounted) setVideo(null);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [videoId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleToggleMembersOnly = async () => {
        if (!video) return;
        try {
            await videosApi.toggleMembersOnly(video.id, !video.isRequiredPackage);
            setVideo((prev) => (prev ? { ...prev, isRequiredPackage: !prev.isRequiredPackage } : null));
            onRefresh();
        } catch (err) {
            console.error('Erişim yetkisi değiştirilemedi:', err);
        }
    };

    if (!isRendered || !videoId) return null;

    const durationMin = video?.durationSec ? Math.round(video.durationSec / 60) : 0;

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
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground text-sm leading-tight">
                                {video?.title || 'Video Önizleme'}
                            </h2>
                            <p className="text-xs text-muted-foreground">{video?.studio?.name || 'Stüdyo İçeriği'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {video && (
                            <button
                                onClick={handleToggleMembersOnly}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${video.isRequiredPackage
                                    ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                    }`}
                            >
                                {video.isRequiredPackage ? 'Paket Zorunlu' : 'Herkese Açık'}
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

                {/* Content */}
                {isLoading ? (
                    <div className="p-12 flex-1 flex justify-center items-center text-xs text-muted-foreground gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Video detayları yükleniyor...
                    </div>
                ) : !video ? (
                    <div className="p-12 flex-1 text-center text-xs text-muted-foreground">Video detayı bulunamadı.</div>
                ) : (
                    <div className="p-5 overflow-y-auto flex-1 space-y-5">
                        {/* Oynatıcı Önizleme Alanı */}
                        <div className="relative aspect-video bg-input rounded-2xl border border-border overflow-hidden flex items-center justify-center group shadow-xs">
                            {video.thumbnailUrl ? (
                                <Image
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    fill
                                    className="w-full h-full object-cover"
                                />
                            ) : null}
                            <div className="absolute p-4 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform cursor-pointer backdrop-blur-xs">
                                <Play className="w-8 h-8 fill-primary" />
                            </div>
                        </div>

                        {/* Metrikler */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                <span className="text-[10px] text-muted-foreground block font-medium">Video Süresi</span>
                                <span className="text-sm font-bold text-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" /> {durationMin} Dakika
                                </span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                                <span className="text-[10px] text-muted-foreground block font-medium">Yayın Durumu</span>
                                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {video.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border col-span-2 sm:col-span-1">
                                <span className="text-[10px] text-muted-foreground block font-medium">Branş</span>
                                <span className="text-sm font-bold text-primary block mt-0.5">{video.discipline}</span>
                            </div>
                        </div>

                        {/* İçerik Bilgileri */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">İçerik Detayları</h3>
                            <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">
                                {video.description || 'Açıklama belirtilmemiş.'}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-muted-foreground">Stüdyo:</span>
                                    <strong className="text-foreground">{video.studio?.name || 'Ana Stüdyo'}</strong>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-muted-foreground">Yüklenme:</span>
                                    <strong className="text-foreground">
                                        {video.createdAt
                                            ? new Date(video.createdAt).toLocaleDateString('tr-TR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            })
                                            : 'Bugün'}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}