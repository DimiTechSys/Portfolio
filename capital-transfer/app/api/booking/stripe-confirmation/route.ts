import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { isValidEmail } from '@/lib/emailValidation';
import { sendBookingConfirmationEmail } from '@/lib/sendBookingConfirmation';
import { markCheckoutConfirmationEmailSent, wasCheckoutConfirmationEmailSent } from '@/lib/checkoutEmailDedup';
import {
  clientEmailFromStripeSession,
  pickupIsoFromCheckoutMetadata,
  routeLabelFromCheckoutMetadata,
} from '@/lib/stripeCheckoutConfirmationPayload';

/**
 * Called after Stripe redirect so the client receives a confirmation email even if the
 * webhook is delayed or not configured locally. Idempotent per Checkout Session id.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
    }

    if (await wasCheckoutConfirmationEmailSent(sessionId)) {
      return NextResponse.json({ success: true, deduped: true });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, error: 'payment_not_completed' }, { status: 400 });
    }

    const metadata = (session.metadata || {}) as Record<string, string | undefined>;
    const to = clientEmailFromStripeSession(session);
    if (!isValidEmail(to)) {
      return NextResponse.json({ success: false, error: 'invalid_email' }, { status: 400 });
    }

    const intentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent &&
            typeof session.payment_intent === 'object' &&
            'id' in (session.payment_intent as object)
          ? (session.payment_intent as { id: string }).id
          : null;

    let bookingReference = '';
    if (intentId) {
      try {
        const b = await prisma.booking.findFirst({
          where: { stripe_payment_id: intentId },
          orderBy: { created_at: 'desc' },
        });
        if (b) bookingReference = b.booking_reference;
      } catch (e) {
        console.error('[stripe-confirmation] booking lookup failed:', e);
      }
    }
    if (!bookingReference) {
      bookingReference = `WEB-${sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase()}`;
    }

    const routeLabel = routeLabelFromCheckoutMetadata(metadata);
    const pickupIso = pickupIsoFromCheckoutMetadata(metadata);
    const amountEur = (session.amount_total ?? 0) / 100;
    const vehicleId = (metadata.vehicleId as string) || 'sedan';
    const clientName = (metadata.fullName as string) || 'Client';

    const sent = await sendBookingConfirmationEmail({
      to,
      clientName,
      bookingReference,
      routeLabel,
      pickupIso,
      vehicleId,
      amountEur,
      paymentMode: 'stripe_paid',
    });

    if (!sent.ok) {
      console.error('[stripe-confirmation] sendBookingConfirmationEmail:', sent.error);
      return NextResponse.json({ success: false, error: sent.error }, { status: 502 });
    }

    await markCheckoutConfirmationEmailSent(sessionId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[stripe-confirmation]', e);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
