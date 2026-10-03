'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Search,
    Filter,
    Calendar,
    Loader2,
    AlertCircle,
    Eye,
    X,
    User,
    Building,
    Activity,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { auditLogApi, AuditLogItem, AuditCategory } from '@/lib/audit-log.api';
import { AxiosError } from 'axios';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtre State'leri
    const [actionSearch, setActionSearch] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'ALL'>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Detay Modalı State
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    const loadLogs = useCallback(
        async (targetPage = 1) => {
            setIsLoading(true);
            setError('');
            try {
                const data = await auditLogApi.getLogs({
                    action: actionSearch || undefined,
                    category: categoryFilter,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    page: targetPage,
                    limit: 20,
                });

                setLogs(data.logs);
                setPagination(data.pagination);
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Denetim kayıtları yüklenirken hata oluştu.');
                } else {
                    setError('Beklenmeyen bir hata oluştu.');
                }
            } finally {
                setIsLoading(false);
            }
        },
        [actionSearch, categoryFilter, startDate, endDate]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            loadLogs(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [loadLogs]);

    // Kategori Badge Renklendirme
    const getCategoryBadgeClass = (category: AuditCategory) => {
        switch (category) {
            case 'AUTH':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'USER_MANAGEMENT':
            case 'USER_MANAGEMENT':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'PACKAGE':
            case 'STORE':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'BOOKING':
            case 'APPOINTMENT':
            case 'WORKSHOP':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'SYSTEM':
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Sayfa Başlığı */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-primary" /> Denetim Günlükleri (Audit Logs)
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sistem ve stüdyo bünyesinde gerçekleştirilen tüm hassas ve kritik işlemleri izleyin.
                </p>
            </div>

            {/* Filtreleme Çubuğu */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Aksiyon Ara */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={actionSearch}
                            onChange={(e) => setActionSearch(e.target.value)}
                            placeholder="İşlem adı ara (örn: USER_CREATED)"
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Kategori Filtresi */}
                    <div className="relative">
                        <Filter className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as AuditCategory | 'ALL')}
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        >
                            <option value="ALL">Tüm Kategoriler</option>
                            <option value="AUTH">AUTH (Kimlik Doğrulama)</option>
                            <option value="USER_MANAGEMENT">USER_MANAGEMENT (Kullanıcı)</option>
                            <option value="PACKAGE">PACKAGE (Paket / Üyelik)</option>
                            <option value="BOOKING">BOOKING (Ders & Rezervasyon)</option>
                            <option value="APPOINTMENT">APPOINTMENT (Randevular)</option>
                            <option value="STORE">STORE (Mağaza Satışı)</option>
                            <option value="WORKSHOP">WORKSHOP (Atölyeler)</option>
                            <option value="SYSTEM">SYSTEM (Sistem / Stüdyolar)</option>
                        </select>
                    </div>

                    {/* Başlangıç Tarihi */}
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Bitiş Tarihi */}
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
            </div>

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Log Tablosu */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-foreground">
                        <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3">Tarih / Saat</th>
                                <th className="px-4 py-3">İşlem Yapan (Actor)</th>
                                <th className="px-4 py-3">Kategori</th>
                                <th className="px-4 py-3">Aksiyon</th>
                                <th className="px-4 py-3">IP Adresi</th>
                                <th className="px-4 py-3 text-right">Detay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                        Denetim günlükleri yükleniyor...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        Kriterlerinize uygun denetim kaydı bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {log.actor ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <div>
                                                        <div className="font-semibold text-foreground">{log.actor.name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{log.actor.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Sistem / Anonim</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                                                    log.category
                                                )}`}
                                            >
                                                {log.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 font-mono font-semibold text-foreground">
                                            {log.action}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-muted-foreground text-[11px]">
                                            {log.ipAddress || '127.0.0.1'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                title="Detayları Gör"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Sayfalama (Pagination) Controls */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                            Toplam <span className="font-bold text-foreground">{pagination.total}</span> kayıt içinden{' '}
                            <span className="font-bold text-foreground">{pagination.page}</span>. sayfa
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page <= 1 || isLoading}
                                onClick={() => loadLogs(pagination.page - 1)}
                                className="p-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-semibold text-foreground">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages || isLoading}
                                onClick={() => loadLogs(pagination.page + 1)}
                                className="p-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Detay JSON Modalı */}
            {selectedLog && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" /> Log Detayı (#{selectedLog.id.substring(0, 8)})
                            </h2>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
                            {/* Meta Bilgileri */}
                            <div className="grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-xl border border-border">
                                <div>
                                    <span className="text-[10px] text-muted-foreground block font-medium">İşlem</span>
                                    <span className="font-mono font-bold text-foreground">{selectedLog.action}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block font-medium">Kategori</span>
                                    <span className="font-bold text-foreground">{selectedLog.category}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block font-medium">İşlem Yapan</span>
                                    <span className="text-foreground">{selectedLog.actor?.name || 'Sistem'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block font-medium">Stüdyo</span>
                                    <span className="text-foreground flex items-center gap-1">
                                        <Building className="w-3 h-3 text-muted-foreground" />
                                        {selectedLog.studio?.name || 'SaaS Genel'}
                                    </span>
                                </div>
                            </div>

                            {/* JSON Payload Detayı */}
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                    İşlem Meta Verisi (Payload)
                                </span>
                                <pre className="bg-slate-950 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                                </pre>
                            </div>

                            {/* User Agent */}
                            {selectedLog.userAgent && (
                                <div>
                                    <span className="text-[10px] text-muted-foreground block font-medium">Cihaz / User Agent</span>
                                    <p className="font-mono text-[10px] text-muted-foreground break-all bg-muted p-2 rounded-lg border border-border">
                                        {selectedLog.userAgent}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}