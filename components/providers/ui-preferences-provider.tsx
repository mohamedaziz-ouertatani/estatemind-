'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupportedLanguage, Language, translations } from '@/lib/i18n';

type ThemeMode = 'light' | 'dark';

const STORAGE_LANGUAGE_KEY = 'app_language';
const STORAGE_THEME_KEY = 'app_theme';

type UiPreferencesContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  t: (key: string) => string;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

export function UiPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_LANGUAGE_KEY);
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);

    if (isSupportedLanguage(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_THEME_KEY, themeMode);
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  const value = useMemo<UiPreferencesContextValue>(
    () => ({
      language,
      setLanguage,
      themeMode,
      setThemeMode,
      t: (key: string) => translations[language][key] || key,
    }),
    [language, themeMode],
  );

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error('useUiPreferences must be used within UiPreferencesProvider');
  }
  return context;
}
