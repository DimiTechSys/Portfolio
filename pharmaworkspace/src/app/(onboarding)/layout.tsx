'use client'

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingProgressBar } from "@/components/onboarding/progress-bar";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-6 py-12">
      <div className="mb-8">
        <span className="text-2xl font-bold tracking-tight">
          Pharma<span className="text-teal-500">Workspace</span>
        </span>
      </div>
      <OnboardingProgressBar />
      <div className="w-full max-w-md rounded-xl border bg-background p-8 shadow-sm">
        {/*
          AnimatePresence avec mode="wait" : la page sortante finit son anim
          d'exit avant que l'entrante démarre son enter. Clé sur le pathname
          pour que Framer détecte le changement de route. Animation subtile
          slide-up + fade, pas de direction (forward/back) pour rester smooth
          dans les deux sens sans tracking de previous path.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
