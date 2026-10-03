'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { classesApi, ClassDefinitionItem } from '@/lib/classes.api';
import { ClassModal } from '@/components/classes/class.modal';
import { ClassStats } from '@/components/classes/class.stats';
import { Calendar, Plus, Loader2, Clock, Users, Search, Edit2, Trash2, AlertCircle, Filter, Building2 } from 'lucide-react';
import { AxiosError } from 'axios';

export default function ClassesPage() {
    const t = useLanguageStore((state) => state.t());
    const [classes, setClasses] = useState<ClassDefinitionItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtre State'leri
    const [search, setSearch] = useState<string>('');
    const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');

    // Modal State'leri
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedClassForEdit, setSelectedClassForEdit] = useState<ClassDefinitionItem | null>(null);

    const loadClasses = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await classesApi.getClasses({
                search: search || undefined,
                discipline: disciplineFilter !== 'ALL' ? disciplineFilter : undefined,
            });
            setClasses(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Dersler yüklenirken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, disciplineFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadClasses();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadClasses]);

    // Frontend Güvenlik Süzgeci: Servis filtreyi es geçse dahi ekranda doğruluğu garanti eder
    const filteredClasses = useMemo(() => {
        return classes.filter((item) => {
            const matchesSearch = search.trim() === '' ||
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.description?.toLowerCase().includes(search.toLowerCase());

            const matchesDiscipline = disciplineFilter === 'ALL' ||
                item.discipline.toUpperCase() === disciplineFilter.toUpperCase();

            return matchesSearch && matchesDiscipline;
        });
    }, [classes, search, disciplineFilter]);

    const handleEditClick = (item: ClassDefinitionItem) => {
        setSelectedClassForEdit(item);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (item: ClassDefinitionItem) => {
        if (!window.confirm(`"${item.title}" ders şablonunu silmek istediğinize emin misiniz?`)) return;

        try {
            await classesApi.deleteClass(item.id);
            loadClasses();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Ders silinemedi.');
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedClassForEdit(null);
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        {t.classes.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.classes.subtitle}</p>
                </div>

                <button
                    onClick={() => {
                        setSelectedClassForEdit(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    {t.classes.createButton}
                </button>
            </div>

            {/* İstatistik Bandı */}
            <ClassStats classes={filteredClasses} />

            {/* Arama & Filtre Barı */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ders veya şablon adı ile ara..."
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={disciplineFilter}
                        onChange={(e) => setDisciplineFilter(e.target.value)}
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

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Grid Liste */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Dersler yükleniyor...
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                    {t.classes.noClasses}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((item) => (
                        <div
                            key={item.id}
                            className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-primary/10 text-primary border-primary/20">
                                        {item.discipline}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-muted text-muted-foreground border-border">
                                        {item.level || 'GENEL'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                )}
                                {item.studio && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                                        <Building2 className="w-3 h-3 text-muted-foreground" />
                                        <span>{item.studio.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-primary" /> {item.durationMin} Dk
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-primary" /> Max {item.maxCapacity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(item)}
                                        className="p-1.5 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <ClassModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={loadClasses}
                initialData={selectedClassForEdit}
            />
        </div>
    );
}