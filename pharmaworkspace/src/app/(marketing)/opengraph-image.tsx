import { ImageResponse } from 'next/og'

export const alt = 'PharmaWorkspace : la coordination de votre officine, en un seul espace'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Image de partage social générée dynamiquement (pas d'asset 1200×630 à maintenir).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: 80,
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, fontWeight: 700 }}>
          PharmaWorkspace
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Toute la coordination de votre officine, dans un seul espace.
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, opacity: 0.92 }}>
            Tâches · Ordonnances · Ruptures · Planning · hébergé en France, RGPD.
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
