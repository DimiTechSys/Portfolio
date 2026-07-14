// En-tête de marque partagé par tous les emails transactionnels :
// logo (icône) + mot-symbole « PharmaWorkspace », identique au header de la
// landing page.
//
// L'URL du logo pointe vers le domaine PROD public (www) : les emails de test
// envoyés depuis staging doivent quand même afficher l'image, et la prod n'est
// pas derrière la protection Vercel. URL finale directe (sans redirection 307)
// pour les clients mail qui ne suivent pas les redirects.

import { Column, Img, Row, Section, Text } from '@react-email/components'

const LOGO_URL = 'https://www.pharmaworkspace.fr/logo.png'

export function BrandHeader() {
  return (
    <Section style={{ marginBottom: '8px' }}>
      <Row>
        <Column style={{ width: '40px', verticalAlign: 'middle' }}>
          <Img
            src={LOGO_URL}
            width="32"
            height="32"
            alt="PharmaWorkspace"
            style={{ borderRadius: '8px', display: 'block' }}
          />
        </Column>
        <Column style={{ verticalAlign: 'middle', paddingLeft: '10px' }}>
          <Text
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            PharmaWorkspace
          </Text>
        </Column>
      </Row>
    </Section>
  )
}
