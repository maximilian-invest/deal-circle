import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mitgliederbereich · DealCircle Salzburg",
  description: "Interner Bereich für Mitglieder des DealCircle Salzburg — nächste Treffen, Anmeldung, Galerie, vergangene Abende.",
  robots: { index: false, follow: false },
};

export default function MitgliederLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
