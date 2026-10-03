/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef } from 'react';
import { videosApi } from '@/lib/videos.api';
import { Image as ImageIcon, Loader2, Upload, X, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface ProductImageUploaderProps {
    imageUrl?: string;
    onImageUploaded: (url: string) => void;
    onImageRemoved: () => void;
}

export function ProductImageUploader({
    imageUrl,
    onImageUploaded,
    onImageRemoved,
}: ProductImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMsg('');
        setIsUploading(true);

        try {
            // 1. Backend'den R2 Upload URL Al
            const { uploadUrl, publicUrl } = await videosApi.getUploadUrl({
                fileName: `product-${Date.now()}-${file.name}`,
                contentType: file.type,
                folder: 'thumbnails',
            });

            // 2. Doğrudan R2'ye Yükle
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!response.ok) {
                throw new Error('Görsel bulut sunucusuna yüklenemedi.');
            }

            onImageUploaded(publicUrl);
        } catch (err: any) {
            console.error('Ürün görseli yükleme hatası:', err);
            setErrorMsg(err?.message || 'Görsel yüklenirken bir hata oluştu.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-foreground block">Ürün Görseli</label>

            {errorMsg && (
                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
            />

            {imageUrl ? (
                <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-border group bg-input">
                    <Image
                        src={imageUrl}
                        alt="Ürün Görseli"
                        fill
                        unoptimized
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl bg-background/80 text-foreground hover:bg-background transition-colors cursor-pointer text-xs font-medium flex items-center gap-1"
                        >
                            <Upload className="w-3.5 h-3.5" /> Değiştir
                        </button>
                        <button
                            type="button"
                            onClick={onImageRemoved}
                            className="p-2 rounded-xl bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors cursor-pointer text-xs font-medium flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" /> Kaldır
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 bg-input/40 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                    {isUploading ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Görsel yükleniyor...
                        </div>
                    ) : (
                        <>
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-foreground">Ürün Görseli Yükle</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG veya WEBP</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}