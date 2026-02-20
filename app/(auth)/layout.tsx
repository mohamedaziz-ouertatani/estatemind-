'use client';

import Link from "next/link";
import { LanguageThemeControls } from "@/components/nav/language-theme-controls";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-background dark:to-background flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">E</span>
          </div>
          <span className="text-xl font-bold">EstateMind</span>
        </Link>
        <LanguageThemeControls />
      </header>
      <div className="flex-1 flex items-center justify-center p-4">{children}</div>
    </div>
  );
}
