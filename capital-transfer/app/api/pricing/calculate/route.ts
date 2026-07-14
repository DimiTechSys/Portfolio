import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRICE_TABLE, applyOnDaySurcharge } from '@/lib/bookingPricing';
import { computeBookingPriceEur } from '@/lib/serverBookingPrice';

export async function POST(req: Request) {
  try {
    const { route, vehicleId, paymentMethod, originCoords, destinationCoords } = await req.json();
    const onDay = paymentMethod === 'on_day';

    if (route && route !== 'Custom Route' && PRICE_TABLE[route]) {
      const r = await computeBookingPriceEur(
        { route, vehicleId, originCoords: null, destinationCoords: null },
        { onDay }
      );
      if (!r.ok) {
        return NextResponse.json({ success: false, error: r.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        price: r.price,
        baseRouteEur: r.baseRouteEur,
        currency: 'eur',
      });
    }

    if (route === 'Custom Route' && originCoords?.length === 2 && destinationCoords?.length === 2) {
      const r = await computeBookingPriceEur(
        { route, vehicleId, originCoords, destinationCoords },
        { onDay }
      );
      if (!r.ok) {
        return NextResponse.json({ success: false, error: r.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        price: r.price,
        baseRouteEur: r.baseRouteEur,
        currency: 'eur',
        ...(r.distanceKm != null ? { distanceKm: r.distanceKm } : {}),
      });
    }

    let basePrice = 0;
    try {
      const dbRoute = await (prisma as any).pricingRoute.findFirst({
        where: {
          OR: [{ origin_label: route?.split(' → ')[0] }, { destination_label: route?.split(' → ')[1] }],
        },
      });
      if (dbRoute) {
        const categoryKey = `price_${vehicleId}` as string;
        basePrice = Number(dbRoute[categoryKey]) || 0;
      }
    } catch (dbError) {
      console.error('Database pricing error:', dbError);
    }

    if (basePrice > 0) {
      let finalPrice = basePrice;
      if (onDay) finalPrice = applyOnDaySurcharge(finalPrice);
      return NextResponse.json({ success: true, price: finalPrice, currency: 'eur' });
    }

    if (route === 'Custom Route') {
      return NextResponse.json(
        { success: false, error: 'Coordinates required for custom route' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Unknown route' }, { status: 400 });
  } catch (error: any) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate price' }, { status: 500 });
  }
}
