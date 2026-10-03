/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { Product, CreateProductInput } from '@/lib/products.api';
import { ProductImageUploader } from './product.image.uploader';
import { X, Loader2, Store, AlertCircle } from 'lucide-react';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProductInput) => Promise<void>;
    initialData?: Product | null;
}

export function ProductModal({ isOpen, onClose, onSubmit, initialData }: ProductModalProps) {
    const t = useLanguageStore((state) => state.t());
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [formData, setFormData] = useState<CreateProductInput>({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        imageUrl: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                price: initialData.price || 0,
                stock: initialData.stock || 0,
                imageUrl: initialData.imageUrl || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: 0,
                stock: 0,
                imageUrl: '',
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await onSubmit({
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
            });
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Ürün kaydedilirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Store className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">
                            {initialData ? 'Ürün Bilgilerini Düzenle' : t.store.modalTitle}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Görsel Yükleyici */}
                    <ProductImageUploader
                        imageUrl={formData.imageUrl}
                        onImageUploaded={(url: any) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                        onImageRemoved={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">{t.store.productName} *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ör: Kaydırmaz Pilates Çorabı"
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.store.price} (₺) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.store.stock} *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Açıklama</label>
                        <textarea
                            rows={3}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ürün hakkında kısa bilgi..."
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            {t.store.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.store.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}