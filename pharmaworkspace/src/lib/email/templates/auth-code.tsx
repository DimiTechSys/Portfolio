// Template React Email : email de connexion (code OTP) PharmaWorkspace.
//
// Aligné sur le style de l'invitation (src/lib/email/templates/invitation.tsx) :
// rendu en HTML inline-styles via @react-email/render avant envoi Resend.
// Affiche le code à saisir en évidence + un lien magique de secours.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { BrandHeader } from '@/lib/email/templates/brand-header'

export type AuthCodeEmailProps = {
  recipientEmail: string
  code: string
  magicLink?: string | null
  /** 'signup' personnalise le titre (bienvenue) ; sinon connexion classique. */
  isSignup?: boolean
}

const containerStyle = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '560px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
}

const headingStyle = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  color: '#0f172a',
  margin: '24px 0 12px',
}

const textStyle = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#334155',
  margin: '12px 0',
}

const codeBoxStyle = {
  margin: '24px 0',
  padding: '20px 24px',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  textAlign: 'center' as const,
}

const codeStyle = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '44px',
  fontWeight: 'bold',
  letterSpacing: '12px',
  borderRadius: '8px',
  color: '#0f172a',
  margin: '0',
  // letter-spacing pousse le texte à droite : on compense pour rester centré.
  paddingLeft: '12px',
}

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  margin: '8px 0',
}

const linkStyle = {
  color: '#0f172a',
  textDecoration: 'underline',
  fontSize: '13px',
  wordBreak: 'break-all' as const,
}

const footerStyle = {
  fontSize: '12px',
  color: '#94a3b8',
  lineHeight: '1.5',
  marginTop: '16px',
}

const hrStyle = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

export function AuthCodeEmail({
  recipientEmail,
  code,
  magicLink,
  isSignup = false,
}: AuthCodeEmailProps) {
  const preview = `Votre code de connexion PharmaWorkspace : ${code}`

  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', margin: 0, padding: 0 }}>
        <Container style={containerStyle}>
          {/* Brand */}
          <BrandHeader />

          {/* Titre */}
          <Heading style={headingStyle}>
            {isSignup ? 'Bienvenue sur PharmaWorkspace' : 'Votre code de connexion'}
          </Heading>

          <Text style={textStyle}>Bonjour,</Text>

          <Text style={textStyle}>
            {isSignup
              ? 'Pour finaliser la création de votre espace, saisissez ce code dans la page de vérification :'
              : 'Pour vous connecter à votre espace, saisissez ce code dans la page de vérification :'}
          </Text>

          {/* Code */}
          <Section style={codeBoxStyle}>
            <Text style={codeStyle}>{code}</Text>
          </Section>

          <Text style={{ ...textStyle, fontSize: '13px', color: '#64748b' }}>
            Ce code est valable quelques minutes. Ne le partagez avec personne :
            l&apos;équipe PharmaWorkspace ne vous le demandera jamais.
          </Text>

          {/* Lien magique de secours */}
          {magicLink ? (
            <>
              <Section style={{ textAlign: 'center', margin: '24px 0 8px' }}>
                <Link href={magicLink} style={buttonStyle}>
                  Se connecter directement
                </Link>
              </Section>
              <Text style={{ ...textStyle, fontSize: '13px', color: '#64748b' }}>
                Ou copiez-collez ce lien dans votre navigateur :
              </Text>
              <Link href={magicLink} style={linkStyle}>
                {magicLink}
              </Link>
            </>
          ) : null}

          <Hr style={hrStyle} />

          {/* Footer */}
          <Text style={footerStyle}>
            Cet email a été envoyé à {recipientEmail}. Si vous n&apos;êtes pas à
            l&apos;origine de cette demande, vous pouvez l&apos;ignorer : aucune
            connexion n&apos;aura lieu sans ce code.
          </Text>
          <Text style={footerStyle}>
            PharmaWorkspace, l&apos;espace partagé des équipes officinales françaises.
            Hébergement France, IA française pour l&apos;OCR (Mistral), conforme RGPD.{' '}
            <Link href="https://pharmaworkspace.fr/securite" style={{ color: '#64748b' }}>
              En savoir plus sur notre sécurité
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default AuthCodeEmail
