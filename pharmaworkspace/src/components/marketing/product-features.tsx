import { Check, Barcode } from 'lucide-react'

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-100">
        <Check className="h-3 w-3 text-teal-700" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-base text-slate-700">{children}</span>
    </li>
  )
}

export function ProductFeatures() {
  return (
    <>
      {/* SECTION 1 - TRANSMISSION ÉQUIPE */}
      <section id="produit" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">Transmission équipe</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Plus jamais de note volante.
              </h2>
              <p className="mt-6 text-lg text-pretty text-slate-600">
                Ce qu’un seul collègue a en tête, écrivez-le une fois et toute l’équipe y a accès.
                Le cahier de transmission, les post-it sur l’écran et le groupe WhatsApp deviennent
                un seul flux clair, horodaté, attribué, recherchable.
              </p>
              <ul className="mt-8 space-y-4">
                <Bullet>Tâches attribuées par préparateur, par jour, par urgence</Bullet>
                <Bullet>Notes de transmission entre matin et après-midi, visibles instantanément</Bullet>
                <Bullet>Salon textuel d’équipe sécurisé, sans mélange perso / pro</Bullet>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-6 card-shadow">
                <div className="space-y-3">
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">Léa</span>
                          <span className="text-xs text-slate-500">7:42</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          Commande Aprium reçue ce matin, à vérifier en priorité, il manque peut-être les ampoules vit. D.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">Karim</span>
                          <span className="text-xs text-slate-500">8:15</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          Vérifié, ampoules vit. D bien arrivées (24 boîtes). Je range et clôture.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-teal-600 p-4 text-white">
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
                        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold">Tâche close</span>
                        <p className="mt-1 text-sm opacity-90">Commande Aprium, vérifiée par Karim</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - ORDONNANCES OCR */}
      <section className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 card-shadow">
                <div className="rounded-xl bg-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-white ring-1 ring-slate-200">
                      <svg className="h-5 w-5 text-slate-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <rect x="4" y="3" width="12" height="14" rx="2" />
                        <path d="M7 7h6M7 10h6M7 13h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">ordonnance_bertrand_06-2026.jpg</p>
                      <p className="text-xs text-slate-500">Analysée en 28 secondes par Mistral</p>
                    </div>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">OCR OK</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">DOLIPRANE 1000 mg</p>
                      <p className="text-xs text-slate-500">Boîte de 8 cp · CIP13&nbsp;3400935956439</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">1 b.</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">KARDEGIC 75 mg</p>
                      <p className="text-xs text-slate-500">Boîte de 30 sachets · CIP13&nbsp;3400933458058</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">3 b.</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">SPASFON 80 mg</p>
                      <p className="text-xs text-amber-700">⚠ En rupture, alerte ANSM en cours</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">2 b.</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">Ordonnances</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Une ordonnance scannée, en 30 secondes.
              </h2>
              <p className="mt-6 text-lg text-pretty text-slate-600">
                Notre intelligence artificielle française <strong>Mistral</strong>, hébergée à Paris,
                extrait les médicaments, les dosages et les CIP13. Vous corrigez si besoin, vous validez,
                et tout est tracé pour votre équipe.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-3xl font-bold text-slate-900">~30s</dt>
                  <dd className="mt-1 text-sm text-slate-600">par ordonnance, validation incluse</dd>
                </div>
                <div>
                  <dt className="text-3xl font-bold text-slate-900">France</dt>
                  <dd className="mt-1 text-sm text-slate-600">IA Mistral Paris, aucun transfert UE</dd>
                </div>
                <div>
                  <dt className="text-3xl font-bold text-slate-900">CIP13</dt>
                  <dd className="mt-1 text-sm text-slate-600">code-barres reconnu nativement</dd>
                </div>
                <div>
                  <dt className="text-3xl font-bold text-slate-900">ANSM</dt>
                  <dd className="mt-1 text-sm text-slate-600">alertes rupture intégrées en temps réel</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - RUPTURES */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">Ruptures</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Une rupture signalée en un scan.
              </h2>
              <p className="mt-6 text-lg text-pretty text-slate-600">
                Scannez le code-barre CIP13, c’est tout. Le médicament est ajouté au registre de
                rupture de l’équipe avec l’historique ANSM en face. Quand le produit revient, vous
                êtes notifié automatiquement.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-sm">
                <div className="rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 p-1 card-shadow-lg">
                  <div className="rounded-[2rem] bg-white p-6">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-900">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-slate-900" />
                        <div className="h-2 w-2 rounded-full bg-slate-900" />
                        <div className="h-2 w-2 rounded-full bg-slate-900" />
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">Signaler une rupture</h3>
                    <div className="mt-6 aspect-square rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 ring-1 ring-teal-100">
                      <div className="flex h-full items-center justify-center">
                        <div className="space-y-2 text-center">
                          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                            <Barcode className="h-8 w-8 text-white" aria-hidden="true" />
                          </div>
                          <p className="text-xs font-medium text-slate-700">Visez le code-barres</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Détecté</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">SPASFON 80 mg</p>
                      <p className="text-xs text-slate-600">CIP13 · 3400933458058</p>
                      <button
                        type="button"
                        className="mt-3 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white"
                      >
                        Signaler la rupture
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
