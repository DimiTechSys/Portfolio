import type { Metadata } from "next";
import "../../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getShopSettings } from "@/lib/settings";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [s, t] = await Promise.all([
    getShopSettings(),
    getTranslations({ locale, namespace: "hero" }),
  ]);
  return {
    title: `${s.businessName} — ${t("title")}`,
    description: t("subtitle"),
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "fr" | "en")) notFound();
  setRequestLocale(locale);

  const [messages, settings] = await Promise.all([
    getMessages(),
    getShopSettings(),
  ]);

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Navbar settings={settings} />
          {children}
          <Footer settings={settings} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
