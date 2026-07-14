'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentClientForm({ booking }: { booking: any }) {
  const t = useTranslations();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'on_day' | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!paymentMethod) return;
    setIsLoading(true);

    try {
      if (paymentMethod === 'online') {
        const res = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(t('book_payment_error') || 'Payment error');
        }
      } else {
        const res = await fetch('/api/payment/confirm-on-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id })
        });
        const data = await res.json();
        if (data.success) {
          router.refresh(); // This will trigger the server component to re-fetch and show the "Confirmed" screen
        } else {
          alert(t('book_error') || 'Confirmation error');
        }
      }
    } catch (e) {
      alert('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const amountOnline = booking.amount_charged;
  const amountOnDay = Math.round(booking.amount_charged * 1.10);

  return (
    <main className="min-h-screen pt-32 pb-12 px-4 md:px-8 flex flex-col items-center relative overflow-hidden" style={{
      background: '#0a0a0a',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(66, 15, 26, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(212, 175, 55, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(20, 20, 22, 1) 0px, transparent 100%),
        radial-gradient(at 0% 100%, rgba(66, 15, 26, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(20, 20, 20, 1) 0px, transparent 50%)
      `
    }}>
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay'
      }} />

      <div className="w-full max-w-2xl bg-[#111111] rounded-3xl shadow-2xl p-8 border border-white/5 relative z-10 animate-fade">
        <h2 className="serif font-light text-white text-center mb-8" style={{ fontSize: '32px' }}>
          Confirmez votre réservation
        </h2>

        {/* Booking Summary */}
        <div className="mb-10 bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
              <div style={{ width: '1px', flex: 1, minHeight: '28px', background: '#3A3A3C', margin: '4px 0' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid #C9A84C', flexShrink: 0 }} />
            </div>

            <div className="flex flex-col justify-between flex-1 py-[1px]">
              <span className="font-light text-white" style={{ fontSize: '15px', letterSpacing: '0.04em' }}>
                {booking.origin}
              </span>
              <span className="font-light text-white" style={{ fontSize: '15px', letterSpacing: '0.04em' }}>
                {booking.destination}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <Clock size={16} color="#C9A84C" />
              <span className="text-white/80 text-sm">
                {new Date(booking.pickup_datetime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} color="#C9A84C" />
              <span className="text-white/80 text-sm">{booking.passengers} passager(s)</span>
            </div>
            <div className="col-span-2 text-white/60 text-sm mt-2">
              <span className="uppercase text-[10px] tracking-widest text-[#C9A84C]">Client</span><br />
              {booking.client_name} ({booking.client_phone})
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <h3 className="serif text-2xl text-white mb-6">Mode de paiement</h3>
        <div className="space-y-4">
          <div 
            className="p-6 cursor-pointer flex justify-between items-center transition-all rounded-xl"
            style={{
              backgroundColor: paymentMethod === 'online' ? 'rgba(66, 15, 26, 0.4)' : 'rgba(255,255,255,0.02)',
              border: paymentMethod === 'online' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
            }}
            onClick={() => setPaymentMethod('online')}
          >
            <div>
              <h3 className="serif text-xl flex items-center gap-2 text-white">
                Payer maintenant
                <span className="text-white px-2 py-0.5 uppercase font-bold rounded" style={{ fontSize: '10px', backgroundColor: '#420F1A' }}>Tarif réduit</span>
              </h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Confirmation immédiate par carte</p>
            </div>
            <div className="text-2xl serif font-bold text-white">{amountOnline} €</div>
          </div>

          <div 
            className="p-6 cursor-pointer flex justify-between items-center transition-all rounded-xl"
            style={{
              backgroundColor: paymentMethod === 'on_day' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: paymentMethod === 'on_day' ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.05)',
            }}
            onClick={() => setPaymentMethod('on_day')}
          >
            <div>
              <h3 className="serif text-xl text-white">Payer au chauffeur</h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Espèces ou CB le jour de la course</p>
            </div>
            <div className="text-2xl serif font-bold text-white">{amountOnDay} €</div>
          </div>
        </div>

        <button 
          disabled={!paymentMethod || isLoading} 
          onClick={handleConfirm} 
          className="w-full mt-8 uppercase hover-btn text-white disabled:opacity-50 transition-all" 
          style={{ backgroundColor: '#420F1A', padding: '20px', fontSize: '14px', letterSpacing: '0.1em', borderRadius: '12px' }}
        >
          {isLoading ? 'Traitement en cours...' : 'Confirmer la réservation'}
        </button>
      </div>

      <style jsx>{`
        .hover-btn:hover {
          background-color: #5a1423 !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
