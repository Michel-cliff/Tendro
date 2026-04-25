import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "BidSafe – Gestion intelligente des appels d'offres",
  description: "Découvrez, préparez et soumettez vos dossiers de candidature aux marchés publics avec l'IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
