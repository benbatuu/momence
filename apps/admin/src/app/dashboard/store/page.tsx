'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { productsApi, Product, CreateProductInput } from '@/lib/products.api';
import { ProductModal } from '@/components/store/product.modal';
import {
    Store,
    Plus,
    Loader2,
    CheckCircle2,
    XCircle,
    Search,
    ShoppingBag,
    Trash2,
    Edit2,
    MoreVertical,
    AlertCircle,
    Package,
} from 'lucide-react';
import { AxiosError } from 'axios';
import Image from 'next/image';

export default function StorePage() {
    const t = useLanguageStore((state) => state.t());
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [search, setSearch] = useState<string>('');

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await productsApi.getProducts();
            setProducts(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Ürünler yüklenirken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            await loadProducts();
        };
        fetchProducts();
    }, [loadProducts]);

    const handleCreateOrUpdateProduct = async (data: CreateProductInput) => {
        if (selectedProductForEdit) {
            await productsApi.updateProduct(selectedProductForEdit.id, data);
        } else {
            await productsApi.createProduct(data);
        }
        loadProducts();
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        setActiveMenuId(null);
        if (!window.confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return;

        try {
            await productsApi.deleteProduct(id);
            loadProducts();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Ürün silinemedi.');
            }
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Store className="w-6 h-6 text-primary" />
                        {t.store.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.store.subtitle}</p>
                </div>

                <button
                    onClick={() => {
                        setSelectedProductForEdit(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.store.createButton}
                </button>
            </div>

            {/* Arama Barı */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.store.searchPlaceholder}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Hata Durumu */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Ürün Kartları Grid */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-2xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Ürünler yükleniyor...
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-2xl">
                    {t.store.noProducts}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((p) => (
                        <div
                            key={p.id}
                            className="bg-card border border-border rounded-2xl p-4 shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between group"
                        >
                            <div className="space-y-3">
                                {/* Ürün Görseli Alanı */}
                                <div className="relative h-44 w-full bg-input rounded-xl border border-border overflow-hidden flex items-center justify-center">
                                    {p.imageUrl ? (
                                        <Image
                                            src={p.imageUrl}
                                            alt={p.name}
                                            fill
                                            unoptimized
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                                            <Package className="w-8 h-8 stroke-[1.5]" />
                                            <span className="text-[11px]">Görsel Yok</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-foreground border border-border">
                                        ₺{p.price}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-sm text-foreground">{p.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {p.description || 'Açıklama bulunmuyor.'}
                                    </p>
                                </div>
                            </div>

                            {/* Alt Bilgiler ve Aksiyonlar */}
                            <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                                    <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Stok: {p.stock} Adet
                                </span>

                                <div className="flex items-center gap-2">
                                    {p.stock > 0 ? (
                                        <span className="text-emerald-500 inline-flex items-center gap-1 font-semibold text-[10px]">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Stokta Var
                                        </span>
                                    ) : (
                                        <span className="text-destructive inline-flex items-center gap-1 font-semibold text-[10px]">
                                            <XCircle className="w-3.5 h-3.5" /> Stok Tükendi
                                        </span>
                                    )}

                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                                            className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {activeMenuId === p.id && (
                                            <div className="absolute right-0 bottom-7 w-36 bg-card border border-border rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        setSelectedProductForEdit(p);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-accent text-foreground transition-colors flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Sil
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

            {/* Product Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedProductForEdit(null);
                }}
                onSubmit={handleCreateOrUpdateProduct}
                initialData={selectedProductForEdit}
            />
        </div>
    );
}