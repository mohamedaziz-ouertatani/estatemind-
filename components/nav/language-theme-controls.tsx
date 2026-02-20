'use client';

import { Language } from '@/lib/i18n';
import { useUiPreferences } from '@/components/providers/ui-preferences-provider';

export function LanguageThemeControls() {
  const { language, setLanguage, themeMode, setThemeMode, t } = useUiPreferences();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-muted-foreground">{t('language')}:</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="border rounded px-2 py-1 text-sm bg-background"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>

      <button
        className="border rounded px-2 py-1 text-sm"
        onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
      >
        {themeMode === 'light' ? t('dark') : t('light')}
      </button>
    </div>
  );
}
