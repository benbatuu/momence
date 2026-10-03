'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { instructorsApi, InstructorProfile } from '@/lib/instructors.api';
import { financialsApi, PayoutItem, InstructorFinancialSummary } from '@/lib/financials.api';
import { InstructorModal } from '@/components/instructors/instructor.modal';
import { InstructorStats } from '@/components/instructors/instructor.stats';
import { InstructorDetailDrawer } from '@/components/instructors/instructor.detail.drawer';
import { PayoutModal } from '@/components/payouts/payout.modal';
import {
    Award,
    Plus,
    Loader2,
    CheckCircle2,
    XCircle,
    Search,
    Mail,
    Phone,
    Filter,
    AlertCircle,
    Trash2,
    Eye,
    Edit2,
    MoreVertical,
    Wallet,
    Clock,
    TrendingUp,
    Check,
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function InstructorsPage() {
    const t = useLanguageStore((state) => state.t());

    // Sekme Yönetimi: 'LIST' | 'PAYOUTS'
    const [activeTab, setActiveTab] = useState<'LIST' | 'PAYOUTS'>('LIST');

    // Eğitmen State'leri
    const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Hakediş / Finans State'leri
    const [payouts, setPayouts] = useState<PayoutItem[]>([]);
    const [summary, setSummary] = useState<InstructorFinancialSummary | null>(null);
    const [isPayoutLoading, setIsPayoutLoading] = useState<boolean>(false);

    // Filtreler
    const [search, setSearch] = useState<string>('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL');

    // Modallar ve Drawer
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
    const [selectedInstructorForEdit, setSelectedInstructorForEdit] = useState<InstructorProfile | null>(null);
    const [selectedInstructorIdForDrawer, setSelectedInstructorIdForDrawer] = useState<string | null>(null);

    // Popover Menu
    const [activeMenuInstructorId, setActiveMenuInstructorId] = useState<string | null>(null);

    // Eğitmenleri Yükle
    const loadInstructors = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await instructorsApi.getInstructors({
                search: search || undefined,
                specialty: specialtyFilter !== 'ALL' ? specialtyFilter : undefined,
            });
            setInstructors(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Eğitmenler yüklenirken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, specialtyFilter]);

    // Hakediş Verilerini Yükle
    const loadPayoutsData = useCallback(async () => {
        setIsPayoutLoading(true);
        try {
            const [payoutsData, summaryData] = await Promise.all([
                financialsApi.getPayouts(),
                financialsApi.getInstructorSummary(),
            ]);
            setPayouts(payoutsData);
            setSummary(summaryData);
        } catch (err: unknown) {
            console.error('Hakediş verileri alınamadı:', err);
        } finally {
            setIsPayoutLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'LIST') {
            const timer = setTimeout(() => {
                loadInstructors();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, loadInstructors]);

    useEffect(() => {
        if (activeTab === 'PAYOUTS') {
            const timer = setTimeout(() => {
                loadPayoutsData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [activeTab, loadPayoutsData]);

    const filteredInstructors = useMemo(() => {
        return instructors.filter((inst) => {
            const matchesSearch =
                search.trim() === '' ||
                inst.user?.name.toLowerCase().includes(search.toLowerCase()) ||
                inst.user?.email.toLowerCase().includes(search.toLowerCase()) ||
                inst.bio?.toLowerCase().includes(search.toLowerCase());

            const matchesSpecialty =
                specialtyFilter === 'ALL' ||
                inst.specialties.some((s) => s.toUpperCase() === specialtyFilter.toUpperCase());

            return matchesSearch && matchesSpecialty;
        });
    }, [instructors, search, specialtyFilter]);

    const filteredPayouts = useMemo(() => {
        return payouts.filter(
            (p) =>
                p.instructor.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.session?.title && p.session.title.toLowerCase().includes(search.toLowerCase()))
        );
    }, [payouts, search]);

    const handleDelete = async (id: string, name: string) => {
        setActiveMenuInstructorId(null);
        if (!window.confirm(`"${name}" eğitmenini silmek istediğinize emin misiniz?`)) return;

        try {
            await instructorsApi.deleteInstructor(id);
            loadInstructors();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Eğitmen silinemedi.');
            }
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            await financialsApi.markPayoutAsPaid(id);
            loadPayoutsData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'İşlem gerçekleştirilemedi.');
            }
        }
    };

    const handleDeletePayout = async (id: string) => {
        if (!window.confirm('Bu hakediş kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await financialsApi.deletePayout(id);
            loadPayoutsData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Kayıt silinemedi.');
            }
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header ve Sekme Butonları */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Award className="w-6 h-6 text-primary" />
                        {t.instructors.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.instructors.subtitle}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sekmeler */}
                    <div className="flex items-center gap-1 bg-input p-1 rounded-xl border border-border">
                        <button
                            onClick={() => setActiveTab('LIST')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'LIST'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Eğitmenler
                        </button>
                        <button
                            onClick={() => setActiveTab('PAYOUTS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'PAYOUTS'
                                ? 'bg-card text-primary shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Wallet className="w-3.5 h-3.5" /> Hakediş & Ödemeler
                        </button>
                    </div>

                    {/* Buton Ekleme */}
                    {activeTab === 'LIST' ? (
                        <button
                            onClick={() => {
                                setSelectedInstructorForEdit(null);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            {t.instructors.createButton}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsPayoutModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Hakediş Ekle
                        </button>
                    )}
                </div>
            </div>

            {/* SEKME 1: EĞİTMEN LİSTESİ */}
            {activeTab === 'LIST' && (
                <>
                    <InstructorStats instructors={filteredInstructors} />

                    <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.instructors.searchPlaceholder}
                                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="relative w-full sm:w-48">
                            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={specialtyFilter}
                                onChange={(e) => setSpecialtyFilter(e.target.value)}
                                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                                <option value="ALL">Tüm Branşlar</option>
                                <option value="REFORMER">Reformer Pilates</option>
                                <option value="PILATES">Mat Pilates</option>
                                <option value="YOGA">Yoga</option>
                                <option value="DANCE">Dans</option>
                                <option value="FITNESS_GYM">Fitness / Gym</option>
                                <option value="WELLNESS_SPA">Wellness / Spa</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Eğitmenler yükleniyor...
                        </div>
                    ) : filteredInstructors.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                            {t.instructors.noInstructors}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInstructors.map((inst) => (
                                <div
                                    key={inst.id}
                                    className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3
                                                    onClick={() => setSelectedInstructorIdForDrawer(inst.id)}
                                                    className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    {inst.user?.name || 'Eğitmen'}
                                                </h3>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3 text-primary shrink-0" /> {inst.user?.email}
                                                </div>
                                            </div>

                                            {inst.isActive ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Aktif
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Pasif
                                                </span>
                                            )}
                                        </div>

                                        {inst.bio && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{inst.bio}</p>
                                        )}

                                        <div className="space-y-2 text-xs pt-2 border-t border-border">
                                            <div className="flex flex-wrap gap-1">
                                                {inst.specialties.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-input border border-border text-foreground"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between text-muted-foreground pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-primary shrink-0" /> {inst.user?.phone || '-'}
                                                </span>
                                                <span className="font-semibold text-foreground">₺{inst.hourlyRate} / Seans</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border flex items-center justify-end gap-1.5 relative">
                                        <button
                                            onClick={() => setSelectedInstructorIdForDrawer(inst.id)}
                                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            title="Detayları İncele"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                            onClick={() => {
                                                setActiveMenuInstructorId(null);
                                                setSelectedInstructorForEdit(inst);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={() =>
                                                    setActiveMenuInstructorId(activeMenuInstructorId === inst.id ? null : inst.id)
                                                }
                                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>

                                            {activeMenuInstructorId === inst.id && (
                                                <div className="absolute right-0 bottom-8 w-40 bg-card border border-border rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        onClick={() => handleDelete(inst.id, inst.user?.name || 'Eğitmen')}
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Eğitmeni Sil
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* SEKME 2: HAKEDİŞ & ÖDEMELER */}
            {activeTab === 'PAYOUTS' && (
                <div className="space-y-5">
                    {/* Özet Metrikler */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground font-medium block">Toplam Hakediş</span>
                                <span className="text-lg font-bold text-foreground">
                                    ₺{summary?.summary.totalEarned.toLocaleString('tr-TR') || 0}
                                </span>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground font-medium block">Ödenen Tutar</span>
                                <span className="text-lg font-bold text-emerald-500">
                                    ₺{summary?.summary.totalPaid.toLocaleString('tr-TR') || 0}
                                </span>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground font-medium block">Ödenecek (Bekleyen)</span>
                                <span className="text-lg font-bold text-amber-500">
                                    ₺{summary?.summary.totalPending.toLocaleString('tr-TR') || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Arama Barı */}
                    <div className="bg-card p-3 rounded-2xl border border-border shadow-xs">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Eğitmen veya ders seansına göre ara..."
                                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Hakediş Tablosu */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                        {isPayoutLoading ? (
                            <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Hakedişler yükleniyor...
                            </div>
                        ) : filteredPayouts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground text-xs">
                                Henüz kayıtlı bir hakediş bulunmuyor.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-foreground">
                                    <thead className="bg-input/50 text-muted-foreground font-semibold uppercase border-b border-border">
                                        <tr>
                                            <th className="p-3.5">Eğitmen</th>
                                            <th className="p-3.5">Açıklama / Seans</th>
                                            <th className="p-3.5">Tutar</th>
                                            <th className="p-3.5">Durum</th>
                                            <th className="p-3.5 text-right">Aksiyonlar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredPayouts.map((p) => (
                                            <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                                                <td className="p-3.5 font-bold text-foreground">
                                                    {p.instructor.name}
                                                    <span className="block text-[10px] text-muted-foreground font-normal">
                                                        {p.instructor.email}
                                                    </span>
                                                </td>
                                                <td className="p-3.5">
                                                    {p.session?.title ? (
                                                        <span className="font-medium text-foreground">{p.session.title}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Manuel Hakediş Kaydı</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 font-bold text-foreground">
                                                    ₺{p.amount.toLocaleString('tr-TR')}
                                                </td>
                                                <td className="p-3.5">
                                                    {p.isPaid ? (
                                                        <span className="text-emerald-500 inline-flex items-center gap-1 font-semibold">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Ödendi
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-500 inline-flex items-center gap-1 font-semibold">
                                                            <Clock className="w-3.5 h-3.5" /> Ödeme Bekliyor
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!p.isPaid && (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(p.id)}
                                                                className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                                                title="Ödendi İşaretle"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Öde
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeletePayout(p.id)}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modallar ve Drawer */}
            <InstructorModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedInstructorForEdit(null);
                }}
                onSuccess={loadInstructors}
                initialData={selectedInstructorForEdit}
            />

            <InstructorDetailDrawer
                instructorId={selectedInstructorIdForDrawer}
                onClose={() => setSelectedInstructorIdForDrawer(null)}
                onRefresh={loadInstructors}
            />

            <PayoutModal
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                onSuccess={loadPayoutsData}
                instructors={instructors}
            />
        </div>
    );
}