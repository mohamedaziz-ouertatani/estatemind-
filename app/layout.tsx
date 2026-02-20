import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toast";
import { UiPreferencesProvider } from "@/components/providers/ui-preferences-provider";

export const metadata: Metadata = {
  title: "EstateMind - Intelligence Immobilière en Tunisie",
  description:
    "Plateforme d'intelligence immobilière pour la Tunisie avec évaluations IA, recherche de propriétés et analyse de quartiers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <UiPreferencesProvider>
          {children}
          <Toaster />
        </UiPreferencesProvider>
      </body>
    </html>
  );
}
