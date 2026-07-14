import { Resend } from 'resend';
import { isValidEmail, normalizeEmail } from '@/lib/emailValidation';

export type BookingConfirmationPayload = {
  to: string;
  clientName: string;
  bookingReference: string;
  routeLabel: string;
  pickupIso: string;
  vehicleId: string;
  amountEur: number;
  paymentMode: 'stripe_paid' | 'on_day_pending';
};

export function formatPickupFr(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    }).format(d);
  } catch {
    return iso;
  }
}

function vehicleLabel(id: string): string {
  const map: Record<string, string> = {
    sedan: 'Berline (Classe E)',
    business: 'Berline affaires (Classe S)',
    van: 'Van (Classe V)',
    luxury: 'Berline luxe (Maybach)',
    suv: 'SUV (Range Rover)',
    moto: 'Deux-roues premium',
  };
  return map[id] || id;
}

function buildHtml(p: BookingConfirmationPayload): string {
  const pay =
    p.paymentMode === 'stripe_paid'
      ? '<p><strong>Paiement :</strong> réglé en ligne (carte bancaire).</p>'
      : '<p><strong>Paiement :</strong> à régler le jour du trajet (espèces ou carte) auprès du chauffeur.</p>';
  return `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;background:#fafafa;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5;">
    <h1 style="font-size:20px;margin:0 0 16px;">Capitale Transfer — Confirmation de réservation</h1>
    <p>Bonjour ${escapeHtml(p.clientName)},</p>
    <p>Nous avons bien enregistré votre réservation. Voici le récapitulatif :</p>
    <div style="margin:20px 0;padding:18px 20px;border:1px solid #d4c4a8;background:#fbf6ec;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a6a50;font-weight:700;">Date et heure demandées</p>
      <p style="margin:0;font-size:19px;font-weight:600;color:#1a1a1a;line-height:1.35;">${escapeHtml(formatPickupFr(p.pickupIso))}</p>
      <p style="margin:10px 0 0;font-size:13px;color:#555;">(fuseau horaire : Europe/Paris)</p>
    </div>
    <ul style="padding-left:20px;margin:16px 0;">
      <li><strong>Référence :</strong> ${escapeHtml(p.bookingReference)}</li>
      <li><strong>Trajet :</strong> ${escapeHtml(p.routeLabel)}</li>
      <li><strong>Véhicule :</strong> ${escapeHtml(vehicleLabel(p.vehicleId))}</li>
      <li><strong>Montant :</strong> ${p.amountEur.toFixed(0)} € TTC</li>
    </ul>
    ${pay}
    <p style="margin-top:24px;font-size:14px;color:#555;">Pour toute modification, répondez à cet e-mail ou contactez-nous avec votre numéro de réservation.</p>
    <p style="margin-top:16px;font-size:13px;color:#888;">Capitale Transfer — Paris</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildText(p: BookingConfirmationPayload): string {
  const pay =
    p.paymentMode === 'stripe_paid'
      ? 'Paiement : réglé en ligne (carte bancaire).'
      : 'Paiement : à régler le jour du trajet auprès du chauffeur.';
  return [
    `Capitale Transfer — Confirmation`,
    ``,
    `Bonjour ${p.clientName},`,
    ``,
    `DATE ET HEURE DEMANDÉES`,
    formatPickupFr(p.pickupIso),
    `(Europe/Paris)`,
    ``,
    `Référence : ${p.bookingReference}`,
    `Trajet : ${p.routeLabel}`,
    `Véhicule : ${vehicleLabel(p.vehicleId)}`,
    `Montant : ${p.amountEur.toFixed(0)} € TTC`,
    pay,
  ].join('\n');
}

/**
 * Sends confirmation to the client. Returns ok:false if misconfigured or invalid — callers should log, not throw.
 */
export async function sendBookingConfirmationEmail(
  p: BookingConfirmationPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = normalizeEmail(p.to);
  if (!isValidEmail(to)) {
    return { ok: false, error: 'invalid_recipient' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || 'Capitale Transfer <onboarding@resend.dev>';

  if (!apiKey) {
    console.error('[booking-email] RESEND_API_KEY is not set; skipping confirmation email');
    return { ok: false, error: 'missing_resend_key' };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `Capitale Transfer — Réservation confirmée (${p.bookingReference})`,
      html: buildHtml(p),
      text: buildText(p),
    });

    if (error) {
      console.error('[booking-email] Resend error:', error);
      return { ok: false, error: error.message || 'resend_failed' };
    }
    return { ok: true };
  } catch (e: unknown) {
    console.error('[booking-email] Exception:', e);
    return { ok: false, error: 'send_exception' };
  }
}
