import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeBookingPriceEur } from '@/lib/serverBookingPrice';
import { isValidEmail, normalizeEmail } from '@/lib/emailValidation';
import { sendBookingConfirmationEmail } from '@/lib/sendBookingConfirmation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingData } = body;

    if (!bookingData) {
      return NextResponse.json({ success: false, error: 'Missing booking data' }, { status: 400 });
    }

    const email = normalizeEmail(bookingData.email || '');
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'invalid_email' }, { status: 400 });
    }

    const priced = await computeBookingPriceEur(
      {
        route: bookingData.route,
        vehicleId: bookingData.vehicleId,
        originCoords: bookingData.originCoords ?? null,
        destinationCoords: bookingData.destinationCoords ?? null,
      },
      { onDay: true }
    );

    if (!priced.ok) {
      return NextResponse.json({ success: false, error: priced.error }, { status: 400 });
    }

    const securePrice = priced.price;

    const routeLabel =
      bookingData.route !== 'Custom Route'
        ? bookingData.route
        : `${bookingData.customOrigin || ''} → ${bookingData.customDestination || ''}`;

    const booking = await prisma.booking.create({
      data: {
        booking_reference: `CT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: 'PENDING',
        route_type: bookingData.route === 'Custom Route' ? 'CUSTOM' : 'FIXED',
        origin:
          bookingData.route !== 'Custom Route'
            ? bookingData.route.split(' → ')[0]
            : bookingData.customOrigin || 'Unknown',
        destination:
          bookingData.route !== 'Custom Route'
            ? bookingData.route.split(' → ')[1]
            : bookingData.customDestination || 'Unknown',
        pickup_datetime: new Date(bookingData.dateTime),
        vehicle_category: (bookingData.vehicleId || 'sedan') as
          | 'sedan'
          | 'business'
          | 'van'
          | 'luxury'
          | 'suv'
          | 'moto',
        passengers: parseInt(bookingData.passengers, 10) || 1,
        client_name: bookingData.fullName,
        client_email: email,
        client_phone: bookingData.phone,
        flight_reference: bookingData.flightRef || null,
        notes: bookingData.notes || null,
        payment_method: 'ON_DAY',
        amount_charged: securePrice,
        payment_status: 'PENDING',
      },
    });

    console.log('Manual booking saved successfully:', booking.id);

    const sent = await sendBookingConfirmationEmail({
      to: email,
      clientName: booking.client_name,
      bookingReference: booking.booking_reference,
      routeLabel,
      pickupIso: booking.pickup_datetime.toISOString(),
      vehicleId: booking.vehicle_category,
      amountEur: Number(booking.amount_charged),
      paymentMode: 'on_day_pending',
    });
    if (!sent.ok) {
      console.error('[book-on-day] Confirmation email:', sent.error);
    }

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
