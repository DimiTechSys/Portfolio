import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // TODO: Implement booking creation with Prisma & Stripe
    return NextResponse.json({ success: true, bookingId: 'temp-id', clientSecret: 'pi_test_secret' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
  }
}
