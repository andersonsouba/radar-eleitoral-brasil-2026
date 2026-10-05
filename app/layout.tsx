import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Radar Eleitoral Brasil 2026",
  description:
    "Análise territorial dos candidatos oficialmente eleitos. Dados públicos do TSE.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
