/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { financialsApi } from '@/lib/financials.api';
import type { InstructorProfile } from '@/lib/instructors.api';
import { X, Loader2, Wallet, AlertCircle } from 'lucide-react';

interface PayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    instructors: InstructorProfile[];
}

export function PayoutModal({ isOpen, onClose, onSuccess, instructors }: PayoutModalProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [formData, setFormData] = useState({
        instructorId: instructors[0]?.id || '',
        sessionId: '',
        amount: 500,
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.instructorId) {
            setError('Lütfen bir eğitmen seçin.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await financialsApi.createPayout({
                instructorId: formData.instructorId,
                sessionId: formData.sessionId || undefined,
                amount: Number(formData.amount),
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Hakediş kaydı oluşturulamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-foreground text-sm">Yeni Hakediş Kaydı Tanımla</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Eğitmen *</label>
                        <select
                            value={formData.instructorId}
                            onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        >
                            <option value="">Eğitmen Seçiniz</option>
                            {instructors.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.user?.name} ({inst.user?.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Hakediş Tutarı (₺) *</label>
                        <input
                            type="number"
                            required
                            min={0}
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">İlişkili Seans ID (Opsiyonel)</label>
                        <input
                            type="text"
                            value={formData.sessionId}
                            onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                            placeholder="Ders seansı UUID bilgisi"
                            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}