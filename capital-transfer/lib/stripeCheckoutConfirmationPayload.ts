import { normalizeEmail } from '@/lib/emailValidation';

export type CheckoutSessionEmailSource = {
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  metadata?: Record<string, string | undefined> | null;
};

export function parseStripeCheckoutRoute(metadata: Record<string, string | undefined>): {
  routeType: 'CUSTOM' | 'FIXED';
  origin: string;
  destination: string;
  routeLabel: string;
} {
  const routeMeta = (metadata.route as string) || '';
  const isCustom = routeMeta === 'Custom Route';
  const origin = isCustom
    ? (metadata.custom_origin as string) || 'Unknown'
    : routeMeta.split(' → ')[0] || 'Unknown';
  const destination = isCustom
    ? (metadata.custom_dest as string) || 'Unknown'
    : routeMeta.split(' → ')[1] || 'Unknown';
  const routeLabel = isCustom ? `${origin} → ${destination}` : routeMeta || `${origin} → ${destination}`;
  return {
    routeType: isCustom ? 'CUSTOM' : 'FIXED',
    origin,
    destination,
    routeLabel,
  };
}

export function routeLabelFromCheckoutMetadata(metadata: Record<string, string | undefined>): string {
  return parseStripeCheckoutRoute(metadata).routeLabel;
}

export function clientEmailFromStripeSession(session: CheckoutSessionEmailSource): string {
  const raw =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.client_email ||
    '';
  return normalizeEmail(String(raw || ''));
}

export function pickupIsoFromCheckoutMetadata(metadata: Record<string, string | undefined>): string {
  const raw = metadata.dateTime?.trim();
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}
