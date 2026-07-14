import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/emailValidation';
import { sendBookingConfirmationEmail } from '@/lib/sendBookingConfirmation';
import { markCheckoutConfirmationEmailSent, wasCheckoutConfirmationEmailSent } from '@/lib/checkoutEmailDedup';
import { clientEmailFromStripeSession, parseStripeCheckoutRoute } from '@/lib/stripeCheckoutConfirmationPayload';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const session = event.data.object as {
    id: string;
    metadata?: Record<string, string | undefined>;
    amount_total: number | null;
    payment_intent?: string | null;
    customer_details?: { email?: string | null } | null;
    customer_email?: string | null;
  };

  if (event.type === 'checkout.session.completed') {
    const metadata = session.metadata || {};

    try {
      const { routeType, origin, destination, routeLabel } = parseStripeCheckoutRoute(metadata);
      const clientEmail = clientEmailFromStripeSession(session);
      const amountEur = (session.amount_total ?? 0) / 100;

      let booking: {
        booking_reference: string;
        client_name: string;
        client_email: string;
        pickup_datetime: Date;
        vehicle_category: string;
        amount_charged: unknown;
      };

      if (metadata.bookingId) {
        const updatePayload: {
          status: 'CONFIRMED';
          payment_status: 'PAID';
          payment_method: 'STRIPE';
          stripe_payment_id: string;
          client_email?: string;
        } = {
          status: 'CONFIRMED',
          payment_status: 'PAID',
          payment_method: 'STRIPE',
          stripe_payment_id: (session.payment_intent as string) || '',
        };
        if (isValidEmail(clientEmail)) {
          updatePayload.client_email = clientEmail;
        }
        booking = await prisma.booking.update({
          where: { id: metadata.bookingId },
          data: updatePayload,
        });
        console.log('Existing booking updated successfully for session:', session.id);
      } else {
        booking = await prisma.booking.create({
          data: {
            booking_reference: `CT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            status: 'CONFIRMED',
            route_type: routeType,
            origin,
            destination,
            pickup_datetime: new Date(metadata.dateTime || Date.now()),
            vehicle_category: (metadata.vehicleId || 'sedan') as
              | 'sedan'
              | 'business'
              | 'van'
              | 'luxury'
              | 'suv'
              | 'moto',
            passengers: parseInt(metadata.passengers || '1', 10) || 1,
            client_name: metadata.fullName || 'Client',
            client_email: clientEmail,
            client_phone: metadata.phone || '',
            flight_reference: metadata.flightRef || null,
            notes: metadata.notes || null,
            payment_method: 'STRIPE',
            amount_charged: amountEur,
            stripe_payment_id: (session.payment_intent as string) || '',
            payment_status: 'PAID',
          },
        });
        console.log('Booking created successfully for session:', session.id);
      }

      const to = isValidEmail(clientEmail) ? clientEmail : normalizeEmail(booking.client_email);
      if (isValidEmail(to)) {
        if (await wasCheckoutConfirmationEmailSent(session.id)) {
          console.log('[webhook] Confirmation email already sent for session', session.id);
        } else {
          const sent = await sendBookingConfirmationEmail({
            to,
            clientName: booking.client_name || 'Client',
            bookingReference: booking.booking_reference,
            routeLabel,
            pickupIso: booking.pickup_datetime.toISOString(),
            vehicleId: booking.vehicle_category,
            amountEur: Number(booking.amount_charged),
            paymentMode: 'stripe_paid',
          });
          if (!sent.ok) {
            console.error('[webhook] Confirmation email not sent:', sent.error);
          } else {
            await markCheckoutConfirmationEmailSent(session.id);
          }
        }
      } else {
        console.warn('[webhook] No valid client email; skipping confirmation email');
      }
    } catch (dbError: unknown) {
      console.error('Database error saving booking:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
