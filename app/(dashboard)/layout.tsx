'use client';

import Link from "next/link";
import { LanguageThemeControls } from "@/components/nav/language-theme-controls";
import { useUiPreferences } from "@/components/providers/ui-preferences-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useUiPreferences();

  return (
    <div className="min-h-screen bg-orange-50/40 dark:bg-background">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold">EstateMind</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/properties" className="text-foreground/80 hover:text-primary font-medium">
                {t('properties')}
              </Link>
              <Link href="/neighborhoods" className="text-foreground/80 hover:text-primary font-medium">
                {t('neighborhoods')}
              </Link>
              <Link href="/portfolio" className="text-foreground/80 hover:text-primary font-medium">
                {t('portfolio')}
              </Link>
              <Link href="/opportunities" className="text-foreground/80 hover:text-primary font-medium">
                {t('opportunities')}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageThemeControls />
              <Link href="/login" className="text-foreground/80 hover:text-primary">
                {t('account')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-background border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 EstateMind. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
