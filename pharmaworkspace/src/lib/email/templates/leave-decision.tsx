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

export type LeaveDecisionEmailProps = {
  requesterName: string
  pharmacyName: string
  leaveTypeLabel: string
  periodLabel: string
  approved: boolean
  reviewNote: string | null
  planningUrl: string
}

const containerStyle = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '560px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const headingStyle = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 12px',
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

export function LeaveDecisionEmail(props: LeaveDecisionEmailProps) {
  const statusLabel = props.approved ? 'approuvée' : 'refusée'
  const preview = `Votre demande de congé a été ${statusLabel}`

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={containerStyle}>
          <Text style={{ color: '#059669', fontWeight: 600, fontSize: '18px' }}>
            PharmaWorkspace
          </Text>
          <Heading style={headingStyle}>
            Demande de congé {statusLabel}
          </Heading>
          <Text style={textStyle}>
            Bonjour {props.requesterName},
          </Text>
          <Text style={textStyle}>
            Votre demande de congé ({props.leaveTypeLabel}, {props.periodLabel}) pour{' '}
            {props.pharmacyName} a été <strong>{statusLabel}</strong>.
          </Text>
          {props.reviewNote ? (
            <Text style={textStyle}>
              <strong>Commentaire du titulaire :</strong> {props.reviewNote}
            </Text>
          ) : null}
          <Section>
            <Link href={props.planningUrl} style={buttonStyle}>
              Voir le planning
            </Link>
          </Section>
          <Hr />
          <Text style={{ ...textStyle, fontSize: '13px', color: '#64748b' }}>
            Cet e-mail a été envoyé automatiquement par PharmaWorkspace.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default LeaveDecisionEmail
