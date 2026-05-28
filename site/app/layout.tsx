import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealCircle Salzburg — Ein kuratierter Kreis.",
  description:
    "DealCircle Salzburg ist ein kuratierter Kreis aus Unternehmern, Investoren und Vortragenden. Sechs Treffen im Jahr auf Schloss Wiespach. Zugang auf persönliche Empfehlung.",
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Mona+Sans:wght@400;500;600;700&display=swap"
        />
        <link rel="icon" type="image/svg+xml" href="/assets/logo-mark.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
