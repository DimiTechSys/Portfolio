'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AUTO_DISMISS_MS = 5_000

export function TransitionBanner() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 text-center shadow-sm"
          role="status"
        >
          <p className="text-sm font-semibold text-slate-900">
            🎉 Bravo, vos 4 missions d&apos;inscription sont terminées !
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Voici 8 nouvelles missions pour activer votre équipe.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
