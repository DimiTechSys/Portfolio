import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { ChunkErrorReloader } from "@/components/shared/chunk-error-reloader";

const poppins = localFont({
  variable: "--font-poppins",
  src: [
    { path: "./fonts/poppins-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const SITE_DESCRIPTION =
  "L'espace de travail partagé des équipes officinales françaises : tâches, ordonnances (OCR), ruptures, locations et planning réunis dans un seul endroit. Hébergé en France, conforme RGPD.";

export const metadata: Metadata = {
  metadataBase: new URL("https://pharmaworkspace.fr"),
  title: {
    default: "PharmaWorkspace : La coordination de votre officine, en un seul espace",
    template: "%s | PharmaWorkspace",
  },
  description: SITE_DESCRIPTION,
  applicationName: "PharmaWorkspace",
  keywords: [
    "logiciel officine",
    "logiciel pharmacie",
    "gestion officine",
    "coordination équipe officine",
    "cahier de transmission pharmacie",
    "OCR ordonnance",
    "ruptures de stock médicaments",
    "planning pharmacie",
    "RGPD pharmacie",
    "logiciel pharmacie France",
  ],
  authors: [{ name: "PharmaWorkspace" }],
  creator: "PharmaWorkspace",
  publisher: "PharmaWorkspace",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "PharmaWorkspace",
    url: "https://pharmaworkspace.fr",
    title: "PharmaWorkspace : La coordination de votre officine, en un seul espace",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "PharmaWorkspace : La coordination de votre officine",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Favicon : conventions de fichiers App Router (src/app/icon.png +
  // apple-icon.png). L'ancien favi.webp n'était pas affiché par Safari,
  // qui ne supporte pas le WebP comme favicon.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ChunkErrorReloader />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
