/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown, RotateCcw, Sparkles } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Kullanıcı takvimde 1. tıkı mı attı kontrolü
    const [isSelectingNewRange, setIsSelectingNewRange] = useState<boolean>(false);

    // Takvim içi yerel aralık state'i
    const [internalRange, setInternalRange] = useState<DateRange | undefined>(() => ({
        from: startDate ? parseISO(startDate) : undefined,
        to: endDate ? parseISO(endDate) : undefined,
    }));

    // Popover açıldığında yerel aralığı dışarıdaki güncel değerle eşle
    useEffect(() => {
        if (isOpen) {
            setInternalRange({
                from: startDate ? parseISO(startDate) : undefined,
                to: endDate ? parseISO(endDate) : undefined,
            });
            setIsSelectingNewRange(false);
        }
    }, [isOpen, startDate, endDate]);

    // Popover dışına tıklandığında kapanma
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsSelectingNewRange(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    // Toplam gün sayısını hesaplama
    const totalDays = startDate && endDate
        ? differenceInDays(parseISO(endDate), parseISO(startDate)) + 1
        : 1;

    // Tarih Etiketini Biçimlendirme (Örn: 02 Eki 2026)
    const formatDateLabel = (dateStr: string) => {
        if (!dateStr) return '';
        return format(parseISO(dateStr), 'dd MMM yyyy', { locale: tr });
    };

    // Takvim Üzerinde Aralık Seçimi Tetiklendiğinde
    const handleSelectRange = (range: DateRange | undefined) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Tıklama yoksa işlem yapma
        if (!range) {
            setInternalRange(undefined);
            return;
        }

        // DURUM 1: İlk tık atılıyor (veya daha önce 2. tık tamamlanıp yeni seçime başlandı)
        if (!isSelectingNewRange || !internalRange?.from || (range.from && range.to && !isSelectingNewRange)) {
            const newFrom = range.from || range.to;
            setInternalRange({ from: newFrom, to: undefined });
            setIsSelectingNewRange(true); // Artık 2. tık bekleniyor
            return;
        }

        // DURUM 2: İkinci tık atıldı (Bitiş tarihi seçildi)
        let finalFrom = internalRange.from;
        let finalTo = range.to || range.from;

        if (finalFrom && finalTo && finalTo < finalFrom) {
            const temp = finalFrom;
            finalFrom = finalTo;
            finalTo = temp;
        }

        const completedRange = { from: finalFrom, to: finalTo };
        setInternalRange(completedRange);
        setIsSelectingNewRange(false);

        if (finalFrom && finalTo) {
            const fromStr = format(finalFrom, 'yyyy-MM-dd');
            const toStr = format(finalTo, 'yyyy-MM-dd');

            // 500ms Debounce sonrası servisi çağır ve takvimi kapat
            debounceTimerRef.current = setTimeout(() => {
                onChange(fromStr, toStr);
                setIsOpen(false);
            }, 500);
        }
    };

    // Preset Buton Aksiyonları
    const applyPreset = (preset: 'today' | 'this_week' | 'next_7_days' | 'this_month') => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const now = new Date();
        let start = now;
        let end = now;

        if (preset === 'today') {
            start = now;
            end = now;
        } else if (preset === 'this_week') {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else if (preset === 'next_7_days') {
            start = now;
            end = addDays(now, 6);
        } else if (preset === 'this_month') {
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        setInternalRange({ from: start, to: end });
        setIsSelectingNewRange(false);
        onChange(startStr, endStr);
        setIsOpen(false);
    };

    return (
        <div className="bg-card p-2 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Sol Taraf: Hızlı Filtre Butonları */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                    type="button"
                    onClick={() => applyPreset('today')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 text-foreground transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                    <span>Bugün</span>
                </button>

                <button
                    type="button"
                    onClick={() => applyPreset('next_7_days')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-accent hover:bg-accent/80 text-foreground transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Gelecek 7 Gün</span>
                </button>

                <button
                    type="button"
                    onClick={() => applyPreset('this_week')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-accent hover:bg-accent/80 text-foreground transition-all cursor-pointer whitespace-nowrap"
                >
                    Bu Hafta
                </button>

                <button
                    type="button"
                    onClick={() => applyPreset('this_month')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-accent hover:bg-accent/80 text-foreground transition-all cursor-pointer whitespace-nowrap"
                >
                    Bu Ay
                </button>
            </div>

            {/* Sağ Taraf: Datepicker Popover */}
            <div className="relative shrink-0" ref={popoverRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-xs font-semibold text-primary transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 shrink-0" />
                        <span className="font-mono">
                            {formatDateLabel(startDate)} {startDate !== endDate && `— ${formatDateLabel(endDate)}`}
                        </span>
                        {/* Toplam Gün Sayısı Rozeti */}
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                            {totalDays} Gün
                        </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* İnteraktif Takvim Popover */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 z-50 bg-card border border-border rounded-2xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 w-auto min-w-[280px]">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase px-1 pb-2 mb-2 border-b border-border flex justify-between items-center gap-4">
                            <span>Tarih Aralığı Seçin</span>
                            <span className="text-[10px] text-primary lowercase font-normal shrink-0">
                                {isSelectingNewRange ? '2. tık: Bitiş Tarihi Seçin' : '1. tık: Başlangıç Tarihi'}
                            </span>
                        </div>

                        <DayPicker
                            mode="range"
                            defaultMonth={internalRange?.from || new Date()}
                            selected={internalRange}
                            onSelect={handleSelectRange}
                            locale={tr}
                            className="p-0 m-0"
                            classNames={{
                                root: 'p-0 relative',
                                months: 'flex flex-col space-y-4',
                                month: 'space-y-3',
                                month_caption: 'flex justify-center items-center relative pt-1 pb-2',
                                caption_label: 'text-xs font-bold text-foreground capitalize',
                                nav: 'absolute inset-x-0 top-1 flex justify-between items-center z-10 pointer-events-none',
                                button_previous: 'h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-accent text-foreground transition-all cursor-pointer pointer-events-auto',
                                button_next: 'h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-accent text-foreground transition-all cursor-pointer pointer-events-auto',
                                month_grid: 'w-full border-collapse space-y-1',
                                weekdays: 'flex justify-between border-b border-border/40 pb-1 mb-1',
                                weekday: 'text-muted-foreground font-normal text-[0.7rem] text-center w-8',
                                week: 'flex w-full mt-1 justify-between',
                                day: 'h-8 w-8 text-center text-xs p-0 relative focus-within:relative focus-within:z-20',
                                day_button: 'h-8 w-8 p-0 font-normal text-xs text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer flex items-center justify-center',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}