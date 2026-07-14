import type { Metadata } from 'next'
import { Poppins, Roboto_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

const poppinsSans = Poppins({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})
const robotoMono = Roboto_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flagship — Backoffice concession',
  description: 'Gestion de flotte, CRM, devis & facturation pour concessions automobiles',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${poppinsSans.variable} ${robotoMono.variable} antialiased bg-background text-foreground`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
