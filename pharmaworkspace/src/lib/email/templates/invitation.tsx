// Template React Email : invitation à rejoindre une officine PharmaWorkspace.
//
// Rendu en HTML inline-styles via @react-email/render avant envoi Resend.
// Compatible Gmail, Apple Mail, Outlook 365 / desktop, mobile clients.

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

export type InvitationEmailProps = {
  recipientEmail: string
  inviterName: string | null
  pharmacyName: string
  roleLabel: string
  acceptUrl: string
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

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  margin: '24px 0',
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

export function InvitationEmail({
  recipientEmail,
  inviterName,
  pharmacyName,
  roleLabel,
  acceptUrl,
}: InvitationEmailProps) {
  const preview = `${inviterName ? inviterName + ' vous invite' : 'Vous êtes invité·e'} à rejoindre ${pharmacyName} sur PharmaWorkspace.`

  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', margin: 0, padding: 0 }}>
        <Container style={containerStyle}>
          {/* Brand */}
          <BrandHeader />

          {/* Titre + intro */}
          <Heading style={headingStyle}>
            {inviterName
              ? `${inviterName} vous invite à rejoindre ${pharmacyName}`
              : `Vous êtes invité·e à rejoindre ${pharmacyName}`}
          </Heading>

          <Text style={textStyle}>
            Bonjour,
          </Text>

          <Text style={textStyle}>
            {inviterName ? `${inviterName} a` : "L'équipe de votre officine a"} créé un espace
            PharmaWorkspace pour <strong>{pharmacyName}</strong> et vous invite à le rejoindre en
            tant que <strong>{roleLabel}</strong>.
          </Text>

          <Text style={textStyle}>
            Sur PharmaWorkspace, vous pourrez voir les tâches en cours et les notes de
            transmission de toute l&apos;équipe, scanner les ordonnances pour gagner du temps,
            signaler une rupture en un clic, et discuter avec vos collègues dans le salon
            textuel. Pas de mot de passe à créer : le lien ci-dessous vous connecte directement.
          </Text>

          {/* CTA */}
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={acceptUrl} style={buttonStyle}>
              Accepter l&apos;invitation
            </Link>
          </Section>

          {/* Lien brut fallback */}
          <Text style={{ ...textStyle, fontSize: '13px', color: '#64748b' }}>
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
          </Text>
          <Link href={acceptUrl} style={linkStyle}>
            {acceptUrl}
          </Link>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Text style={footerStyle}>
            Cet email a été envoyé à {recipientEmail}. Si vous n&apos;attendiez pas cette
            invitation, vous pouvez l&apos;ignorer : aucun compte ne sera créé sans votre action.
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

export default InvitationEmail
