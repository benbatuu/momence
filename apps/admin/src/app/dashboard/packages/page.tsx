'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { packagesApi, PackageTemplate } from '@/lib/packages.api';
import { PackageModal } from '@/components/packages/package.modal';
import { PackageStats } from '@/components/packages/package.stats';
import {
    Ticket,
    Plus,
    Loader2,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    AlertCircle,
    Trash2,
    Edit2,
    MoreVertical,
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function PackagesPage() {
    const t = useLanguageStore((state) => state.t());
    const [packages, setPackages] = useState<PackageTemplate[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtreler
    const [search, setSearch] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedPackageForEdit, setSelectedPackageForEdit] = useState<PackageTemplate | null>(null);

    // Aksiyon Popover State
    const [activeMenuPackageId, setActiveMenuPackageId] = useState<string | null>(null);

    const loadPackages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await packagesApi.getPackages({
                search: search || undefined,
                type: typeFilter !== 'ALL' ? typeFilter : undefined,
            });
            setPackages(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Paketler yüklenirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, typeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPackages();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadPackages]);

    // Frontend Fallback Filtreleme
    const filteredPackages = useMemo(() => {
        return packages.filter((pkg) => {
            const matchesSearch =
                search.trim() === '' ||
                pkg.name.toLowerCase().includes(search.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(search.toLowerCase());

            const matchesType = typeFilter === 'ALL' || pkg.type === typeFilter;

            return matchesSearch && matchesType;
        });
    }, [packages, search, typeFilter]);

    // Durum Değiştirme (Aktif / Pasif)
    const handleToggleStatus = async (pkg: PackageTemplate) => {
        setActiveMenuPackageId(null);
        try {
            await packagesApi.togglePackageStatus(pkg.id, !pkg.isActive);
            loadPackages();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Durum değiştirilemedi.');
            }
        }
    };

    // Silme Aksiyonu
    const handleDelete = async (id: string, name: string) => {
        setActiveMenuPackageId(null);
        if (!window.confirm(`"${name}" paket şablonunu silmek istediğinize emin misiniz?`)) return;

        try {
            await packagesApi.deletePackage(id);
            loadPackages();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Paket silinemedi.');
            }
        }
    };

    const handleEditClick = (pkg: PackageTemplate) => {
        setActiveMenuPackageId(null);
        setSelectedPackageForEdit(pkg);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedPackageForEdit(null);
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-primary" />
                        {t.packages.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.packages.subtitle}</p>
                </div>

                <button
                    onClick={() => {
                        setSelectedPackageForEdit(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.packages.createButton}
                </button>
            </div>

            {/* İstatistik Bandı */}
            <PackageStats packages={filteredPackages} />

            {/* Arama & Filtre Barı */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Paket veya üyelik adı ile ara..."
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        <option value="ALL">Tüm Paket Tipleri</option>
                        <option value="CREDIT_PACK">{t.packages.typeCredit}</option>
                        <option value="UNLIMITED">{t.packages.typeUnlimited}</option>
                        <option value="RECURRING_SUBSCRIPTION">{t.packages.typeSubscription}</option>
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

            {/* Liste Tablosu */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Paketler yükleniyor...
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-xs">{t.packages.noPackages}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-foreground">
                            <thead className="bg-input text-muted-foreground font-semibold uppercase border-b border-border">
                                <tr>
                                    <th className="p-3.5">{t.packages.packageName}</th>
                                    <th className="p-3.5">{t.packages.selectType}</th>
                                    <th className="p-3.5">{t.packages.creditsCount}</th>
                                    <th className="p-3.5">{t.packages.validity}</th>
                                    <th className="p-3.5">{t.packages.price}</th>
                                    <th className="p-3.5">{t.packages.status}</th>
                                    <th className="p-3.5 text-right">Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredPackages.map((pkg) => (
                                    <tr key={pkg.id} className="hover:bg-accent/40 transition-colors">
                                        <td className="p-3.5 font-bold text-foreground">{pkg.name}</td>
                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-input border border-border text-foreground">
                                                {pkg.type === 'CREDIT_PACK'
                                                    ? t.packages.typeCredit
                                                    : pkg.type === 'UNLIMITED'
                                                        ? t.packages.typeUnlimited
                                                        : t.packages.typeSubscription}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-muted-foreground">
                                            {pkg.credits ? `${pkg.credits} Hak` : 'Sınırsız'}
                                        </td>
                                        <td className="p-3.5 text-muted-foreground">{pkg.validityDays} Gün</td>
                                        <td className="p-3.5 font-bold text-foreground">
                                            ₺{pkg.price.toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-3.5">
                                            {pkg.isActive ? (
                                                <span className="text-emerald-500 inline-flex items-center gap-1 font-semibold">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                                </span>
                                            ) : (
                                                <span className="text-destructive inline-flex items-center gap-1 font-semibold">
                                                    <XCircle className="w-3.5 h-3.5" /> Pasif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-right relative">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditClick(pkg)}
                                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>

                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            setActiveMenuPackageId(activeMenuPackageId === pkg.id ? null : pkg.id)
                                                        }
                                                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>

                                                    {activeMenuPackageId === pkg.id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                onClick={() => handleToggleStatus(pkg)}
                                                                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-accent text-foreground transition-colors flex items-center gap-2 cursor-pointer"
                                                            >
                                                                {pkg.isActive ? (
                                                                    <>
                                                                        <XCircle className="w-3.5 h-3.5 text-destructive" /> Pasife Al
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Aktif Et
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(pkg.id, pkg.name)}
                                                                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Paketi Sil
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <PackageModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={loadPackages}
                initialData={selectedPackageForEdit}
            />
        </div>
    );
}