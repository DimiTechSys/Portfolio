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

export type LeaveRequestNotificationEmailProps = {
  titulaireName: string | null
  requesterName: string
  pharmacyName: string
  leaveTypeLabel: string
  periodLabel: string
  reason: string | null
  reviewUrl: string
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

export function LeaveRequestNotificationEmail(
  props: LeaveRequestNotificationEmailProps
) {
  const greeting = props.titulaireName
    ? `Bonjour ${props.titulaireName},`
    : 'Bonjour,'

  return (
    <Html>
      <Head />
      <Preview>
        {props.requesterName} a demandé un congé : {props.leaveTypeLabel}
      </Preview>
      <Body style={{ backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={containerStyle}>
          <Text style={{ color: '#059669', fontWeight: 600, fontSize: '18px' }}>
            PharmaWorkspace
          </Text>
          <Heading style={headingStyle}>Nouvelle demande de congé</Heading>
          <Text style={textStyle}>{greeting}</Text>
          <Text style={textStyle}>
            <strong>{props.requesterName}</strong> ({props.pharmacyName}) a soumis une
            demande de congé :
          </Text>
          <Text style={textStyle}>
            <strong>Type :</strong> {props.leaveTypeLabel}
            <br />
            <strong>Période :</strong> {props.periodLabel}
            {props.reason ? (
              <>
                <br />
                <strong>Motif :</strong> {props.reason}
              </>
            ) : null}
          </Text>
          <Section>
            <Link href={props.reviewUrl} style={buttonStyle}>
              Traiter la demande
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

export default LeaveRequestNotificationEmail
