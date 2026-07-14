import type { ReactNode } from 'react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { AcquisitionTracker } from '@/components/marketing/acquisition-tracker'
import { CookieBanner } from '@/components/marketing/cookie-banner'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <AcquisitionTracker />
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <CookieBanner />
    </div>
  )
}
