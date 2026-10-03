/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { videosApi, OnDemandVideo, CreateVideoPayload } from '@/lib/videos.api';
import { VideoUploader } from '@/components/ondemand/video.uploader';
import type { DisciplineType } from '@/types/studio.types';
import { X, Loader2, Video, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

interface OnDemandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: OnDemandVideo | null;
}

export function OnDemandModal({ isOpen, onClose, onSuccess, initialData }: OnDemandModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isRendered, setIsRendered] = useState<boolean>(isOpen);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [formData, setFormData] = useState<CreateVideoPayload>({
        title: '',
        description: '',
        discipline: 'PILATES' as DisciplineType,
        durationSec: 0,
        videoUrl: '',
        thumbnailUrl: '',
        isRequiredPackage: true,
    });

    // Modal açılış/kapanış animasyon yönetimi
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

    // Düzenleme verisi geldiğinde veya modal sıfırlandığında form state güncelleme
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                discipline: (initialData.discipline as DisciplineType) || 'PILATES',
                durationSec: initialData.durationSec || 0,
                videoUrl: initialData.videoUrl || '',
                thumbnailUrl: initialData.thumbnailUrl || '',
                isRequiredPackage: initialData.isRequiredPackage ?? true,
            });
        } else {
            setFormData({
                title: '',
                description: '',
                discipline: 'PILATES' as DisciplineType,
                durationSec: 0,
                videoUrl: '',
                thumbnailUrl: '',
                isRequiredPackage: true,
            });
        }
    }, [initialData, isOpen]);

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

        if (!formData.videoUrl) {
            setError('Lütfen bir video dosyası yükleyin.');
            return;
        }

        setIsLoading(true);

        try {
            if (initialData) {
                await videosApi.updateVideo(initialData.id, formData);
            } else {
                await videosApi.createVideo(formData);
            }
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Video kaydedilirken bir hata oluştu.');
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
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Video className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">
                            {initialData ? 'Video Bilgilerini Düzenle' : t.ondemand.modalTitle}
                        </h2>
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

                    {/* R2 Presigned Video & Otomatik Thumbnail Yükleyici */}
                    <VideoUploader
                        initialVideoUrl={formData.videoUrl}
                        initialThumbnailUrl={formData.thumbnailUrl}
                        onVideoUploaded={({ videoUrl, thumbnailUrl, durationSec }) => {
                            setFormData((prev) => ({
                                ...prev,
                                videoUrl,
                                thumbnailUrl,
                                durationSec,
                            }));
                        }}
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.ondemand.videoTitle} *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="ör: 20 Dakikalık Sabah Vinyasa Yoga Serisi"
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.ondemand.discipline} *</label>
                        <select
                            value={formData.discipline}
                            onChange={(e) =>
                                setFormData({ ...formData, discipline: e.target.value as DisciplineType })
                            }
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        >
                            <option value="PILATES">Mat Pilates</option>
                            <option value="REFORMER">Reformer Pilates</option>
                            <option value="YOGA">Yoga</option>
                            <option value="FITNESS">Fitness</option>
                            <option value="BARRE">Barre</option>
                            <option value="OTHER">Diğer</option>
                        </select>
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

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="isRequiredPackage"
                            checked={formData.isRequiredPackage}
                            onChange={(e) => setFormData({ ...formData, isRequiredPackage: e.target.checked })}
                            className="w-4 h-4 rounded-md border-border bg-input text-primary focus:ring-ring cursor-pointer"
                        />
                        <label htmlFor="isRequiredPackage" className="text-xs text-foreground cursor-pointer select-none">
                            Paket Zorunlu (Sadece aktif üye paketi olan kullanıcılar izleyebilir)
                        </label>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.ondemand.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.videoUrl}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.ondemand.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}