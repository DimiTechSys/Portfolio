import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import LuxuryEffects from "@/components/LuxuryEffects";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import Script from 'next/script';

export const metadata: Metadata = {
  title: "Capitale Transfer | Private Chauffeur Service Paris & Île-de-France",
  description: "Ultra-premium, discreet chauffeur service in Paris. Corporate travel and luxury tourism. Professional private drivers 24/7.",
  keywords: ["chauffeur Paris", "VTC Paris", "airport transfer Paris", "transfert aéroport CDG", "chauffeur privé Île-de-France", "Paris private driver"],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <Script defer data-domain="capitaletransfer.fr" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <LuxuryEffects />
          <Navbar />
          {children}
          <FooterWrapper />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
