/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Loader2, CreditCard, AlertCircle, UserCheck, Package, ShoppingBag } from 'lucide-react';

interface CustomerOption {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

interface PackageOption {
    id: string;
    name: string;
    price: number;
}

interface ProductOption {
    id: string;
    name: string;
    price: number;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Seçenek Listeleri
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);

    // Müşteri Arama
    const [customerSearch] = useState<string>('');

    // Form State
    const [category, setCategory] = useState<'PACKAGE' | 'STORE' | 'MANUAL'>('PACKAGE');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');

    // Modal Açıldığında Müşteri, Paket ve Ürünleri Çek
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setIsFetchingData(true);

        Promise.all([
            api.get('/users?role=CLIENT').catch(() => ({ data: { data: [] } })),
            api.get('/packages').catch(() => ({ data: { data: [] } })),
            api.get('/store/products').catch(() => ({ data: { data: [] } })),
        ])
            .then(([usersRes, packagesRes, productsRes]) => {
                if (!isMounted) return;

                const usersData = usersRes.data?.data?.users || usersRes.data?.data || usersRes.data || [];
                const packagesData = packagesRes.data?.data?.packages || packagesRes.data?.data || packagesRes.data || [];
                const productsData = productsRes.data?.data?.products || productsRes.data?.data || productsRes.data || [];

                setCustomers(Array.isArray(usersData) ? usersData : []);
                setPackages(Array.isArray(packagesData) ? packagesData : []);
                setProducts(Array.isArray(productsData) ? productsData : []);
            })
            .finally(() => {
                if (isMounted) setIsFetchingData(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Paket veya Ürün Seçildiğinde Tutarı Otomatik Doldur
    const handleItemSelect = (itemId: string) => {
        setSelectedItemId(itemId);
        if (category === 'PACKAGE') {
            const selectedPkg = packages.find((p) => p.id === itemId);
            if (selectedPkg) setAmount(selectedPkg.price);
        } else if (category === 'STORE') {
            const selectedProd = products.find((p) => p.id === itemId);
            if (selectedProd) setAmount(selectedProd.price);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId) {
            setError('Lütfen ödemeyi yapan müşteriyi seçin.');
            return;
        }

        if (amount <= 0) {
            setError('Lütfen geçerli bir ödeme tutarı girin.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const payload: any = {
                userId: selectedCustomerId,
                amount: Number(amount),
                paymentMethod,
            };

            if (category === 'PACKAGE' && selectedItemId) {
                payload.clientPackageId = selectedItemId;
            } else if (category === 'STORE' && selectedItemId) {
                payload.orderId = selectedItemId;
            }

            await api.post('/payments', payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Ödeme kaydı oluşturulurken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.email.toLowerCase().includes(customerSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground text-sm">Manuel Ödeme / Satış Al</h2>
                            <p className="text-[11px] text-muted-foreground">Müşteri seçerek ödeme kaydı ekleyin</p>
                        </div>
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

                    {isFetchingData ? (
                        <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Müşteri ve ürün verileri yükleniyor...
                        </div>
                    ) : (
                        <>
                            {/* 1. Satış Kategorisi Seçimi */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">Ödeme Türü / İşlem</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategory('PACKAGE');
                                            setSelectedItemId('');
                                            setAmount(0);
                                        }}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${category === 'PACKAGE'
                                            ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                            : 'bg-input border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Package className="w-3.5 h-3.5" /> Paket Satışı
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategory('STORE');
                                            setSelectedItemId('');
                                            setAmount(0);
                                        }}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${category === 'STORE'
                                            ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                            : 'bg-input border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5" /> Mağaza (POS)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategory('MANUAL');
                                            setSelectedItemId('');
                                            setAmount(0);
                                        }}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${category === 'MANUAL'
                                            ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                            : 'bg-input border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <CreditCard className="w-3.5 h-3.5" /> Özel Tutar
                                    </button>
                                </div>
                            </div>

                            {/* 2. Müşteri Seçimi (Arama Destekli Dropdown) */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5 text-primary" /> Müşteri Seçin *
                                </label>
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                    required
                                >
                                    <option value="">-- Listeden Müşteri Seçin --</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. İçerik Seçimi (Paket veya Mağaza Ürünü) */}
                            {category === 'PACKAGE' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Tanımlanacak Paket</label>
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => handleItemSelect(e.target.value)}
                                        className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                    >
                                        <option value="">-- Paket Seçiniz --</option>
                                        {packages.map((pkg) => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name} — ₺{pkg.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {category === 'STORE' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Satılan Mağaza Ürünü</label>
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => handleItemSelect(e.target.value)}
                                        className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                    >
                                        <option value="">-- Ürün Seçiniz --</option>
                                        {products.map((prod) => (
                                            <option key={prod.id} value={prod.id}>
                                                {prod.name} — ₺{prod.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* 4. Tutar ve Ödeme Yöntemi */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Tahsil Edilen Tutar (₺) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Ödeme Yöntemi *</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                    >
                                        <option value="CREDIT_CARD">Kredi Kartı</option>
                                        <option value="CASH">Nakit</option>
                                        <option value="EFT">EFT / Havale</option>
                                        <option value="PAYTR">Online (PayTR)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Alt Butonlar */}
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
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ödemeyi Kaydet'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}