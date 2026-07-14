import Image from 'next/image'
import Link from 'next/link'
import { SUPPORT_EMAIL } from '@/config/constants'

export function MarketingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
              <span className="text-base font-semibold tracking-tight text-slate-900">PharmaWorkspace</span>
            </div>
            <p className="mt-4 text-sm text-slate-600">L’espace partagé des équipes officinales françaises.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Produit</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li><Link href="/#produit" className="transition hover:text-slate-900">Modules</Link></li>
              <li><Link href="/tarifs" className="transition hover:text-slate-900">Tarifs</Link></li>
              <li>
                <a
                  href="https://hotline.baseflow.fr/?context=footer_demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-slate-900"
                >
                  Réserver une démo
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Légal</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li><Link href="/securite" className="transition hover:text-slate-900">Sécurité</Link></li>
              <li><Link href="/privacy" className="transition hover:text-slate-900">Politique de confidentialité</Link></li>
              <li><Link href="/conditions-generales" className="transition hover:text-slate-900">Conditions Générales</Link></li>
              <li><Link href="/dpa" className="transition hover:text-slate-900">Accord de Sous-Traitance (DPA)</Link></li>
              <li><Link href="/cookies" className="transition hover:text-slate-900">Cookies</Link></li>
              <li><Link href="/mentions-legales" className="transition hover:text-slate-900">Mentions légales</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-slate-900">
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {year} PharmaWorkspace. Tous droits réservés.</p>
          <p>Hébergé en France · Conforme RGPD · IA française (Mistral)</p>
        </div>
      </div>
    </footer>
  )
}
