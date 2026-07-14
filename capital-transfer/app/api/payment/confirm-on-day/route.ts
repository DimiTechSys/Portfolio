import { NextResponse } from 'next/server';
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

    // Since it's on-day, update the amount by 10% penalty
    const amountCharged = Number(booking.amount_charged);
    const newAmount = Math.round(amountCharged * 1.10);

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        payment_method: 'ON_DAY',
        status: 'CONFIRMED',
        amount_charged: newAmount,
      }
    });

    return NextResponse.json({ success: true, bookingId: updatedBooking.id });
  } catch (error: any) {
    console.error('Database error confirming on-day booking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to confirm booking',
      }, 
      { status: 500 }
    );
  }
}
