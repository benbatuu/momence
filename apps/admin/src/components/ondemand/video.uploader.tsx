'use client';

import React, { useState, useRef } from 'react';
import { videosApi } from '@/lib/videos.api';
import { Film, Image as ImageIcon, CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { AxiosError } from 'axios';
import Image from 'next/image';

interface VideoUploaderProps {
    initialVideoUrl?: string;
    initialThumbnailUrl?: string;
    onVideoUploaded: (data: { videoUrl: string; thumbnailUrl: string; durationSec: number }) => void;
}

export function VideoUploader({ initialVideoUrl, initialThumbnailUrl, onVideoUploaded }: VideoUploaderProps) {
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl || '');
    const [durationSec, setDurationSec] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);

    // Videodan Tuval (Canvas) ile Otomatik Kapak Görseli Al
    const generateThumbnailFromVideo = (file: File): Promise<{ blob: Blob; duration: number }> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.playsInline = true;

            video.onloadeddata = () => {
                video.currentTime = Math.min(1, video.duration / 2);
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1280;
                canvas.height = video.videoHeight || 720;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(video.src);
                        if (blob) {
                            resolve({ blob, duration: Math.round(video.duration) });
                        } else {
                            reject(new Error('Kapak görseli çıkarılamadı.'));
                        }
                    },
                    'image/jpeg',
                    0.85
                );
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                reject(new Error('Video dosyası okunamadı.'));
            };
        });
    };

    // Presigned URL İle Cloudflare R2'ye Yükleme
    const uploadFileToR2 = async (
        file: File | Blob,
        fileName: string,
        contentType: string,
        folder: 'videos' | 'thumbnails'
    ) => {
        const { uploadUrl, publicUrl } = await videosApi.getUploadUrl({
            fileName,
            contentType,
            folder,
        });

        // R2 / S3 Presigned URL doğrudan PUT isteği bekler
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file,
        });

        if (!response.ok) {
            throw new Error('Dosya bulut sunucusuna yüklenemedi.');
        }

        return publicUrl;
    };

    // Video Seçildiğinde
    const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMsg('');
        setIsUploadingVideo(true);
        setVideoProgress(15);

        try {
            // 1. Videoyu Yükle
            const uploadedVideoUrl = await uploadFileToR2(file, file.name, file.type, 'videos');
            setVideoUrl(uploadedVideoUrl);
            setVideoProgress(60);

            // 2. Videodan Kare Al & Süreyi Çıkar
            const { blob: autoThumbBlob, duration } = await generateThumbnailFromVideo(file);
            setDurationSec(duration);
            setVideoProgress(85);

            // 3. Otomatik Thumbnail'i R2'ye Yükle
            let finalThumbUrl = thumbnailUrl;
            if (!thumbnailUrl) {
                const autoThumbName = `auto-thumb-${Date.now()}.jpg`;
                finalThumbUrl = await uploadFileToR2(autoThumbBlob, autoThumbName, 'image/jpeg', 'thumbnails');
                setThumbnailUrl(finalThumbUrl);
            }

            setVideoProgress(100);

            onVideoUploaded({
                videoUrl: uploadedVideoUrl,
                thumbnailUrl: finalThumbUrl,
                durationSec: duration,
            });
        } catch (err: unknown) {
            console.error('Video yükleme hatası:', err);
            if (err instanceof AxiosError) {
                setErrorMsg(err.response?.data?.message || 'Stüdyo bilgisi doğrulanamadı veya yükleme başarısız oldu.');
            } else if (err instanceof Error) {
                setErrorMsg(err.message);
            } else {
                setErrorMsg('Video yüklenirken beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // Özel Thumbnail Yükleme
    const handleCustomThumbSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMsg('');
        setIsUploadingThumb(true);

        try {
            const customThumbUrl = await uploadFileToR2(file, file.name, file.type, 'thumbnails');
            setThumbnailUrl(customThumbUrl);

            if (videoUrl) {
                onVideoUploaded({
                    videoUrl,
                    thumbnailUrl: customThumbUrl,
                    durationSec,
                });
            }
        } catch (err: unknown) {
            console.error('Görsel yükleme hatası:', err);
            if (err instanceof AxiosError) {
                setErrorMsg(err.response?.data?.message || 'Görsel yüklenemedi. Stüdyo bilgisi eksik olabilir.');
            } else {
                setErrorMsg('Görsel yüklenirken bir hata oluştu.');
            }
        } finally {
            setIsUploadingThumb(false);
        }
    };

    return (
        <div className="space-y-3">
            {errorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Video Yükleme Alanı */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Video Dosyası *</label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={handleVideoSelect}
                />

                <div
                    onClick={() => !isUploadingVideo && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${videoUrl
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-border hover:border-primary/50 bg-input/40'
                        }`}
                >
                    {isUploadingVideo ? (
                        <div className="space-y-2 py-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-semibold text-foreground">Video Yükleniyor & Thumbnail Oluşturuluyor...</p>
                            <div className="w-48 bg-border h-1.5 rounded-full overflow-hidden mx-auto">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${videoProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Video Yüklendi ({Math.round(durationSec / 60)} Dk)
                        </div>
                    ) : (
                        <>
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Film className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-foreground">Video Yüklemek İçin Tıklayın</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">MP4, MOV veya WebM (Presigned R2)</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Thumbnail Yükleme ve Önizleme Alanı */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> Kapak Görseli (Thumbnail)
                    </label>
                    <button
                        type="button"
                        onClick={() => thumbInputRef.current?.click()}
                        disabled={isUploadingThumb}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                        Özel Görsel Yükle
                    </button>
                </div>

                <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCustomThumbSelect}
                />

                <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-2xl border border-border">
                    {isUploadingThumb ? (
                        <div className="h-16 w-28 bg-input rounded-xl flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    ) : thumbnailUrl ? (
                        <Image
                            src={thumbnailUrl}
                            alt="Thumbnail"
                            width={112}
                            height={64}
                            unoptimized
                            className="h-16 w-28 object-cover rounded-xl border border-border shrink-0"
                        />
                    ) : (
                        <div className="h-16 w-28 bg-input rounded-xl border border-border flex items-center justify-center text-muted-foreground shrink-0">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">
                            {thumbnailUrl ? 'Kapak Görseli Hazır' : 'Henüz görsel oluşturulmadı'}
                        </p>
                        <p className="text-[11px] leading-relaxed">
                            Video yüklendiğinde otomatik karesi alınır. İsterseniz yukarıdan özel kapak görseli de yükleyebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}