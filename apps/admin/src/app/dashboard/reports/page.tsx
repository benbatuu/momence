'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { api } from '@/lib/api';
import type { StudioReportsOverview } from '@/types/reports.types';
import {
    BarChart3,
    TrendingUp,
    Users,
    CalendarCheck,
    Loader2,
    DollarSign,
    Ticket,
    Dumbbell,
    Sparkles,
    Store,
    PieChart as PieIcon,
    Activity,
    AlertCircle,
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
} from 'recharts';
import { AxiosError } from 'axios';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function ReportsPage() {
    const t = useLanguageStore((state) => state.t());
    const [data, setData] = useState<StudioReportsOverview | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const loadReports = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.get('/reports/overview');
            setData(res.data?.data || res.data || null);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Raporlar yüklenirken bir hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await loadReports();
        };
        fetchData();
    }, [loadReports]);

    // Grafik Veri Hazırlığı
    const pieData = data
        ? [
            { name: 'Paket Satışları', value: data.revenue.packagesRevenue },
            { name: 'Özel Seanslar', value: data.revenue.appointmentsRevenue },
            { name: 'Atölyeler', value: data.revenue.workshopsRevenue },
            { name: 'Mağaza Satışı', value: data.revenue.storeRevenue },
        ]
        : [];

    const trendData = [
        { name: 'Pzt', ciro: 12500, katilim: 45 },
        { name: 'Sal', ciro: 18200, katilim: 62 },
        { name: 'Çar', ciro: 15400, katilim: 58 },
        { name: 'Per', ciro: 21000, katilim: 75 },
        { name: 'Cum', ciro: 28500, katilim: 92 },
        { name: 'Cmt', ciro: 34000, katilim: 110 },
        { name: 'Paz', ciro: 12900, katilim: 40 },
    ];

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        {t.reports.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.reports.subtitle}</p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2 bg-card border border-border rounded-2xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Analitik verileri hazırlanıyor...
                </div>
            ) : !data ? (
                <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-2xl">
                    {t.reports.noData}
                </div>
            ) : (
                <>
                    {/* Metrik Kartları */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{t.reports.totalRevenue}</span>
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground tracking-tight">
                                ₺{data.revenue.totalRevenue.toLocaleString('tr-TR')}
                            </div>
                            <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" /> +%{data.revenue.monthlyGrowthRate} bu ay
                            </p>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{t.reports.occupancyRate}</span>
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground tracking-tight">
                                %{data.attendance.averageOccupancyRate}
                            </div>
                            <p className="text-[11px] text-muted-foreground">Kapasite Verimliliği</p>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{t.reports.totalBookings}</span>
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    <CalendarCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground tracking-tight">
                                {data.attendance.totalBookings} Seans
                            </div>
                            <p className="text-[11px] text-muted-foreground">İptal Oranı: %{data.attendance.cancellationRate}</p>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Tamamlanan Ders</span>
                                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                    <Activity className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground tracking-tight">
                                {data.attendance.completedClasses} Seans
                            </div>
                            <p className="text-[11px] text-muted-foreground">Dönem İçi Tamamlanan</p>
                        </div>
                    </div>

                    {/* Grafik Alanları */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Haftalık Ciro Trendi (Area Chart) */}
                        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Haftalık Ciro & Performans Akışı
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-card)',
                                                borderColor: 'var(--color-border)',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ciro"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorCiro)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gelir Dağılım Pasta Grafiği (Pie Chart) */}
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <PieIcon className="w-4 h-4 text-primary" />
                                Gelir Kaynak Dağılımı
                            </h3>
                            <div className="h-52 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                                {pieData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2 text-[11px]">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        />
                                        <span className="text-muted-foreground truncate">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Gelir Kırılım Kartları */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-primary" />
                            {t.reports.revenueBreakdownTitle}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-4 bg-input/50 border border-border rounded-xl space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <Ticket className="w-3.5 h-3.5 text-primary" />
                                    <span>{t.reports.packageSales}</span>
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                    ₺{data.revenue.packagesRevenue.toLocaleString('tr-TR')}
                                </div>
                            </div>

                            <div className="p-4 bg-input/50 border border-border rounded-xl space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <Dumbbell className="w-3.5 h-3.5 text-primary" />
                                    <span>{t.reports.privateAppointments}</span>
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                    ₺{data.revenue.appointmentsRevenue.toLocaleString('tr-TR')}
                                </div>
                            </div>

                            <div className="p-4 bg-input/50 border border-border rounded-xl space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                    <span>{t.reports.workshopsAndEvents}</span>
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                    ₺{data.revenue.workshopsRevenue.toLocaleString('tr-TR')}
                                </div>
                            </div>

                            <div className="p-4 bg-input/50 border border-border rounded-xl space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <Store className="w-3.5 h-3.5 text-primary" />
                                    <span>{t.reports.storeSales}</span>
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                    ₺{data.revenue.storeRevenue.toLocaleString('tr-TR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popüler Dersler Tablosu */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            {t.reports.topClassesTitle}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-foreground">
                                <thead className="bg-input/50 text-muted-foreground font-semibold uppercase border-b border-border">
                                    <tr>
                                        <th className="p-3.5">{t.reports.className}</th>
                                        <th className="p-3.5">{t.reports.discipline}</th>
                                        <th className="p-3.5">{t.reports.attendees}</th>
                                        <th className="p-3.5 text-right">{t.reports.revenue}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.topClasses.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-accent/40 transition-colors">
                                            <td className="p-3.5 font-bold text-foreground">{item.className}</td>
                                            <td className="p-3.5">
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                                    {item.discipline}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">{item.totalAttendees} Danışan Katıldı</td>
                                            <td className="p-3.5 font-bold text-foreground text-right">
                                                ₺{item.revenueGenerated.toLocaleString('tr-TR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}