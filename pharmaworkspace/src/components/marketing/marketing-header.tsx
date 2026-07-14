import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-slate-900">PharmaWorkspace</span>
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">
          <Link href="/#produit" className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
            Produit
          </Link>
          <Link href="/#tarifs" className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
            Tarifs
          </Link>
          <Link href="/securite" className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
            Sécurité
          </Link>
          <Link href="/#faq" className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-700 transition hover:text-slate-900 sm:inline-block"
          >
            Connexion
          </Link>
          <Link
            href="/signup?source=header"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Démarrer
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}
