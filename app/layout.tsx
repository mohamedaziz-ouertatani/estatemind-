import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "EstateMind - Intelligence Immobilière en Tunisie",
  description: "Plateforme d'intelligence immobilière pour la Tunisie avec évaluations IA, recherche de propriétés et analyse de quartiers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
