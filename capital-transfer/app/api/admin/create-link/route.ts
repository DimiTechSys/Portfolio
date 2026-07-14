import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Only allow authorized calls, maybe check an API key in headers if needed.
    // For now, this is a simple utility endpoint for the Booker.
    
    const body = await req.json();
    const { 
      route, 
      customOrigin, 
      customDestination, 
      dateTime, 
      vehicleId, 
      passengers, 
      fullName, 
      phone, 
      email, 
      price 
    } = body;

    // Create a PENDING booking in the database
    const booking = await prisma.booking.create({
      data: {
        booking_reference: `CT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: 'PENDING',
        route_type: route === 'Custom Route' ? 'CUSTOM' : 'FIXED',
        origin: route !== 'Custom Route' ? route.split(' → ')[0] : (customOrigin || 'Unknown'),
        destination: route !== 'Custom Route' ? route.split(' → ')[1] : (customDestination || 'Unknown'),
        pickup_datetime: new Date(dateTime),
        vehicle_category: vehicleId || 'sedan',
        passengers: parseInt(passengers) || 1,
        client_name: fullName,
        client_email: email || '',
        client_phone: phone,
        payment_method: 'STRIPE', // Placeholder, updated later
        amount_charged: price, // Base price!
        payment_status: 'PENDING',
      }
    });

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    
    // Return the link that the Booker can SMS to the client
    const paymentLink = `${origin}/payment/${booking.id}`;

    return NextResponse.json({ success: true, paymentLink, bookingId: booking.id });
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
