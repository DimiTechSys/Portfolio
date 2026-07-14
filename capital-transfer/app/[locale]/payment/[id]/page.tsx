import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PaymentClientForm from './PaymentClientForm';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default async function PaymentPage(props: { params: Promise<{ id: string, locale: string }> }) {
  const params = await props.params;
  const booking = await prisma.booking.findUnique({
    where: { id: params.id }
  });

  if (!booking) {
    notFound();
  }

  if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
    return (
      <main className="min-h-screen pt-32 pb-12 px-4 flex flex-col items-center justify-center text-center relative" style={{ background: '#0a0a0a' }}>
        <div className="flex justify-center mb-6">
          <div className="text-white p-6 rounded-full" style={{ backgroundColor: '#420F1A' }}>
            <Check size={48} />
          </div>
        </div>
        <h1 className="serif text-5xl mb-4 text-white">Réservation Confirmée</h1>
        <p className="text-xl max-w-md mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Cette réservation a déjà été payée ou confirmée. Merci pour votre confiance !
        </p>
        <Link href="/" className="inline-block uppercase text-white hover-btn" style={{ backgroundColor: '#420F1A', padding: '16px 32px', letterSpacing: '0.1em', fontWeight: 500, borderRadius: '12px' }}>
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  // Convert decimal to number for client component
  const bookingData = {
    ...booking,
    amount_charged: Number(booking.amount_charged)
  };

  return <PaymentClientForm booking={bookingData} />;
}
