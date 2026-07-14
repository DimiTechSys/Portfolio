import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { computeBookingPriceEur } from '@/lib/serverBookingPrice';
import { isValidEmail, normalizeEmail } from '@/lib/emailValidation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingData, locale: localeRaw } = body;

    console.log('--- CHECKOUT ATTEMPT ---');
    if (!bookingData) {
      console.error('Missing bookingData in request body');
      return NextResponse.json({ success: false, error: 'Missing booking data' }, { status: 400 });
    }

    const email = normalizeEmail(bookingData.email || '');
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'invalid_email' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    console.log('Origin:', origin);

    const priced = await computeBookingPriceEur(
      {
        route: bookingData.route,
        vehicleId: bookingData.vehicleId,
        originCoords: bookingData.originCoords ?? null,
        destinationCoords: bookingData.destinationCoords ?? null,
      },
      { onDay: false }
    );

    if (!priced.ok) {
      console.error('Price calculation failed:', priced.error);
      return NextResponse.json({ success: false, error: priced.error }, { status: 400 });
    }

    const securePrice = priced.price;
    console.log('Price calculated:', securePrice);

    if (securePrice <= 0) {
      console.error('Invalid calculated price:', securePrice);
      return NextResponse.json({ success: false, error: 'Invalid price' }, { status: 400 });
    }

    const locale =
      typeof localeRaw === 'string' && ['fr', 'en', 'ar', 'ru'].includes(localeRaw) ? localeRaw : 'fr';
    const bookPath = locale === 'fr' ? '/book' : `/${locale}/book`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Transport Capitale Transfer`,
              description: `${bookingData.route || 'Trajet personnalisé'} - Véhicule ${bookingData.vehicleId}`,
            },
            unit_amount: securePrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}${bookPath}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${bookPath}?canceled=true`,
      customer_email: email,
      metadata: {
        route: (bookingData.route || 'Custom').substring(0, 500),
        vehicleId: (bookingData.vehicleId || 'sedan').substring(0, 500),
        fullName: (bookingData.fullName || 'Client').substring(0, 500),
        client_email: email.substring(0, 500),
        phone: (bookingData.phone || '').substring(0, 500),
        dateTime: (bookingData.dateTime || '').substring(0, 500),
        passengers: (bookingData.passengers?.toString() || '1').substring(0, 500),
        flightRef: (bookingData.flightRef || '').substring(0, 500),
        notes: (bookingData.notes || '').substring(0, 500),
        source: 'web_booking',
        ...(bookingData.route === 'Custom Route'
          ? {
              custom_origin: (bookingData.customOrigin || '').substring(0, 500),
              custom_dest: (bookingData.customDestination || '').substring(0, 500),
            }
          : {}),
        ...(priced.distanceKm != null ? { distanceKm: String(priced.distanceKm) } : {}),
      },
    });

    console.log('Stripe session created:', session.id);
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Detailed Stripe error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Payment initiation failed',
        type: error.type || 'unknown',
      },
      { status: 500 }
    );
  }
}
