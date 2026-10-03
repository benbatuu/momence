import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, Translations } from '@/types/i18n.types';
import { dictionary } from '@/config/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: () => Translations;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'tr',
      setLanguage: (language: Language) => set({ language }),
      t: () => dictionary[get().language] || dictionary.tr,
    }),
    {
      name: 'om-pilates-lang',
    }
  )
);