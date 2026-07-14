import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing booking ID' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Booking already confirmed' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    // Price is already determined from amount_charged in DB (which for PENDING could be the base price).
    // Let's ensure the Stripe checkout matches the `amount_charged` which should be the discounted web rate.
    const priceToPay = Number(booking.amount_charged);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Transport Capitale Transfer`,
              description: `${booking.origin} → ${booking.destination} - Véhicule ${booking.vehicle_category}`,
            },
            unit_amount: Math.round(priceToPay * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/book?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/${bookingId}?canceled=true`,
      customer_email: booking.client_email || undefined,
      metadata: {
        bookingId: booking.id, // Explicitly link to the existing DB record
        route: `${booking.origin} → ${booking.destination}`,
        vehicleId: booking.vehicle_category,
        fullName: booking.client_name,
        phone: booking.client_phone,
        dateTime: booking.pickup_datetime.toISOString(),
        passengers: booking.passengers.toString(),
        flightRef: booking.flight_reference || '',
        notes: booking.notes || '',
        source: 'payment_link'
      }
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Detailed Stripe error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Payment initiation failed',
      }, 
      { status: 500 }
    );
  }
}
