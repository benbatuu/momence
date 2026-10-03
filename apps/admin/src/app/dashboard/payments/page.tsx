'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { financialsApi, TransactionItem } from '@/lib/financials.api';
import { PaymentModal } from '@/components/payments/payment.modal';
import { PaymentDetailDrawer } from '@/components/payments/payment.detail.drawer';
import { CreditCard, Plus, Loader2, CheckCircle2, Search, Mail, AlertCircle, Eye } from 'lucide-react';
import { AxiosError } from 'axios';

export default function PaymentsPage() {
    const t = useLanguageStore((state) => state.t());
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');

    const loadPayments = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await financialsApi.getRevenueStats();
            setTransactions(data.recentTransactions || []);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Ödemeler yüklenirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchPayments = async () => {
            await loadPayments();
        };
        fetchPayments();
    }, [loadPayments]);

    const filteredTransactions = transactions.filter(
        (p) =>
            p.customerName.toLowerCase().includes(search.toLowerCase()) ||
            p.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
            p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        {t.payments.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.payments.subtitle}</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.payments.createButton}
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.payments.searchPlaceholder}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Payment Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Yükleniyor...
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-xs">
                        {t.payments.noPayments}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-foreground">
                            <thead className="bg-input/50 text-muted-foreground font-semibold uppercase border-b border-border">
                                <tr>
                                    <th className="p-3.5">{t.payments.customer}</th>
                                    <th className="p-3.5">{t.payments.category}</th>
                                    <th className="p-3.5">{t.payments.method}</th>
                                    <th className="p-3.5">{t.payments.amount}</th>
                                    <th className="p-3.5">{t.payments.status}</th>
                                    <th className="p-3.5 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTransactions.map((p) => (
                                    <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                                        <td className="p-3.5">
                                            <button
                                                onClick={() => setSelectedPaymentId(p.id)}
                                                className="font-bold text-foreground hover:text-primary transition-colors text-left cursor-pointer"
                                            >
                                                {p.customerName}
                                            </button>
                                            <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Mail className="w-3 h-3 text-primary" /> {p.customerEmail}
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <div className="font-medium text-foreground">{p.title}</div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                {p.sourceCategory}
                                            </span>
                                        </td>
                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-input border border-border text-foreground">
                                                {p.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-bold text-foreground">
                                            ₺{p.amount.toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-3.5">
                                            <span className="text-emerald-500 inline-flex items-center gap-1 font-semibold">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Başarılı
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <button
                                                onClick={() => setSelectedPaymentId(p.id)}
                                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                title="Detayları Göster"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadPayments}
            />

            {/* Detay Çekmecesi */}
            <PaymentDetailDrawer
                paymentId={selectedPaymentId}
                onClose={() => setSelectedPaymentId(null)}
            />
        </div>
    );
}