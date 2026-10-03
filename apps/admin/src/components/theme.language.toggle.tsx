'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/lib/language.store';
import { Sun, Moon, Globe } from 'lucide-react';
import type { Language } from '@/types/i18n.types';

// Hydration uyumsuzluğunu önlemek için istemci ortamı tespiti
const emptySubscribe = () => () => { };
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeLanguageToggle() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return (
      <div className="flex items-center gap-2 opacity-0 pointer-events-none">
        <div className="w-12 h-7 bg-input border border-border rounded-lg" />
        <div className="w-7 h-7 bg-input border border-border rounded-lg" />
      </div>
    );
  }

  const handleLanguageToggle = (): void => {
    const nextLanguage: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLanguage);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Dil Değiştirici */}
      <button
        type="button"
        onClick={handleLanguageToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-input border border-border text-foreground hover:bg-accent transition-colors cursor-pointer"
        title="Language / Dil"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="uppercase font-semibold">{language}</span>
      </button>

      {/* Tema Değiştirici */}
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="px-2.5 py-1.5 rounded-lg bg-input border border-border text-foreground hover:bg-accent transition-colors cursor-pointer"
        title="Theme / Tema"
      >
        {theme === 'dark' ? (
          <div className='flex items-center gap-1'>
            <Sun className="w-4 h-4 text-primary" />
            <span className='text-xs'>Light</span>
          </div>
        ) : (
          <div className='flex items-center gap-1'>
            <Moon className="w-4 h-4 text-primary" />
            <span className='text-xs'>Dark</span>
          </div>
        )}
      </button>
    </div>
  );
}