import type { Metadata } from 'next';
import './globals.css';
import NavbarLayout from '@/components/layout/NavbarLayout';
import { LanguageProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Maja & Kents Matpalats - Familjens recept & veckoplanering',
  description: 'Planera dina veckomåltider, optimera näringsintaget, skala recept och upptäck nya familjefavoriter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full antialiased selection:bg-primary selection:text-primary-foreground">
        <LanguageProvider>
          <NavbarLayout>
            {children}
          </NavbarLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
