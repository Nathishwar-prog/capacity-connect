import { create } from 'zustand';

export type Language = 'en' | 'hi' | 'ta';

export interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('preferred_language');
    if (saved === 'en' || saved === 'hi' || saved === 'ta') {
      return saved;
    }
  }
  return 'en';
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language: Language) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('preferred_language', language);
      } catch {
        // ignore storage errors
      }
    }
    set({ language });
  },
}));

export default useLanguageStore;
