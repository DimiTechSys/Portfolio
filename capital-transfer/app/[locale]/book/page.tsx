'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Check, Users, Clock } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import dynamic from 'next/dynamic';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { isValidEmail } from '@/lib/emailValidation';
import {
  PRICE_TABLE,
  applyOnDaySurcharge,
  priceFromRouteBaseAndVehicle,
  sedanRouteBaseEurFromCoords,
} from '@/lib/bookingPricing';

const BookingMap = dynamic(() => import('@/components/BookingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
      <span className="text-neutral-300 text-sm">Chargement…</span>
    </div>
  )
});
function stripeConfirmationEmailUserMessage(error: string | undefined, locale: string): string {
  const en = locale === 'en';
  const pick = (fr: string, english: string) => (en ? english : fr);
  switch (error) {
    case 'missing_resend_key':
      return pick(
        "L'e-mail de confirmation n'a pas été envoyé : RESEND_API_KEY manquante côté serveur.",
        'Confirmation email was not sent: RESEND_API_KEY is missing on the server.'
      );
    case 'invalid_email':
      return pick(
        'Aucune adresse e-mail valide sur la session de paiement. Utilisez la même adresse qu’à l’étape contact.',
        'No valid email on the payment session. Use the same address as in the contact step.'
      );
    case 'invalid_recipient':
      return pick(
        'Adresse destinataire invalide pour l’e-mail de confirmation.',
        'Invalid recipient address for the confirmation email.'
      );
    case 'payment_not_completed':
      return pick(
        'Paiement non finalisé côté Stripe. Si la carte a été débitée, contactez-nous avec l’heure du paiement.',
        'Payment not completed in Stripe. If you were charged, contact us with the time of payment.'
      );
    case 'resend_failed':
      return pick(
        'Resend a refusé l’envoi : vérifiez RESEND_FROM_EMAIL (domaine vérifié) et, en test, que le destinataire est autorisé.',
        'Resend rejected the send: check RESEND_FROM_EMAIL (verified domain) and test recipient rules.'
      );
    case 'send_exception':
      return pick(
        'Erreur technique lors de l’envoi via Resend. Consultez les logs serveur.',
        'Technical error while sending via Resend. Check server logs.'
      );
    case 'server_error':
      return pick(
        'Erreur serveur lors de la confirmation. Vérifiez la base de données et les logs.',
        'Server error during confirmation. Check the database and logs.'
      );
    default:
      return pick(
        error
          ? `L’e-mail de confirmation n’a pas pu être envoyé (code : ${error}).`
          : "L’e-mail de confirmation n’a pas pu être envoyé.",
        error
          ? `The confirmation email could not be sent (code: ${error}).`
          : 'The confirmation email could not be sent.'
      );
  }
}

const VEHICLE_TYPES = [
  { id: 'sedan', name: 'Classe E', subtitleKey: 'fleet_sedan_subtitle', capacity: 3, luggage: 3, basePrice: 35, image: '/class-e.webp' },
  { id: 'business', name: 'Classe S', subtitleKey: 'fleet_business_subtitle', capacity: 3, luggage: 3, basePrice: 75, image: '/class-s.webp' },
  { id: 'van', name: 'Classe V', subtitleKey: 'fleet_van_subtitle', capacity: 7, luggage: 6, basePrice: 110, image: '/class-v.webp' },
  { id: 'luxury', name: 'Maybach', subtitleKey: 'fleet_luxury_subtitle', capacity: 3, luggage: 3, basePrice: 140, image: '/maybach.webp' },
  { id: 'suv', name: 'Range Rover', subtitleKey: 'fleet_suv_subtitle', capacity: 4, luggage: 4, basePrice: 120, image: '/range-rover.webp' },
  { id: 'moto', name: 'Moto Premium', subtitleKey: 'fleet_moto_subtitle', capacity: 1, luggage: 1, basePrice: 25, image: '/moto.webp' },
];

export default function BookingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    route: '',
    customOrigin: '',
    customDestination: '',
    originCoords: null as [number, number] | null,
    destinationCoords: null as [number, number] | null,
    vehicleId: 'sedan',
    fullName: '',
    email: '',
    phone: '',
    passengers: '1',
    dateTime: '',
    flightRef: '',
    notes: '',
    paymentMethod: ''
  });

  const [basePrice, setBasePrice] = useState(0);
  const [customQuoteError, setCustomQuoteError] = useState<string | null>(null);
  const [customQuoteLoading, setCustomQuoteLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [stripeEmailNotice, setStripeEmailNotice] = useState<string | null>(null);

  /** Après paiement Stripe : envoi e-mail de confirmation (idempotent avec le webhook). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') !== 'true') return;
    const sid = params.get('session_id');
    if (!sid) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/booking/stripe-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          deduped?: boolean;
        };
        if (cancelled) return;
        if (!res.ok || data.success === false) {
          console.error('[book] stripe-confirmation failed', res.status, data);
          setStripeEmailNotice(stripeConfirmationEmailUserMessage(data.error, locale));
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[book] stripe-confirmation fetch', e);
          setStripeEmailNotice(
            locale === 'en'
              ? 'Network error while sending the confirmation email.'
              : 'Erreur réseau lors de l’envoi de l’e-mail de confirmation.'
          );
        }
      } finally {
        if (!cancelled) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const fixedKey =
      bookingData.route &&
      bookingData.route !== 'Custom Route' &&
      PRICE_TABLE[bookingData.route]
        ? bookingData.route
        : null;

    if (fixedKey) {
      setBasePrice(PRICE_TABLE[fixedKey]);
      setCustomQuoteError(null);
      setCustomQuoteLoading(false);
      return;
    }

    const customCoordsReady =
      bookingData.route === 'Custom Route' &&
      bookingData.originCoords &&
      bookingData.destinationCoords;

    if (!customCoordsReady) {
      setBasePrice(0);
      setCustomQuoteLoading(false);
      setCustomQuoteError(null);
      return;
    }

    const ac = new AbortController();
    setCustomQuoteLoading(true);
    setCustomQuoteError(null);

    const origin = bookingData.originCoords;
    const destination = bookingData.destinationCoords;
    const localQuote =
      origin && destination ? sedanRouteBaseEurFromCoords(origin, destination) : null;
    if (localQuote) {
      setBasePrice(localQuote.baseRouteEur);
    }

    (async () => {
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: 'Custom Route',
            vehicleId: 'sedan',
            originCoords: origin,
            destinationCoords: destination,
          }),
          signal: ac.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.success || typeof data.baseRouteEur !== 'number') {
          throw new Error('quote');
        }
        setBasePrice(data.baseRouteEur);
        setCustomQuoteError(null);
      } catch {
        if (!ac.signal.aborted) {
          if (localQuote) {
            setBasePrice(localQuote.baseRouteEur);
            setCustomQuoteError(null);
          } else {
            setBasePrice(0);
            setCustomQuoteError(t('book_pricing_error'));
          }
        }
      } finally {
        if (!ac.signal.aborted) setCustomQuoteLoading(false);
      }
    })();

    return () => ac.abort();
  }, [
    bookingData.route,
    bookingData.originCoords?.[0],
    bookingData.originCoords?.[1],
    bookingData.destinationCoords?.[0],
    bookingData.destinationCoords?.[1],
    t,
  ]);

  const calculatePrice = (vehicleId: string, isOnline: boolean) => {
    if (basePrice === 0) return 0;
    const subtotal = priceFromRouteBaseAndVehicle(basePrice, vehicleId);
    return isOnline ? subtotal : applyOnDaySurcharge(subtotal);
  };

  const requestPickupLocation = () => {
    if (!navigator.geolocation) {
      alert(t('book_geolocation_error'));
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const url = `https://api-adresse.data.gouv.fr/reverse/?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;
          const res = await fetch(url);
          const data = await res.json();
          const label = data?.features?.[0]?.properties?.label as string | undefined;
          if (!label?.trim()) {
            alert(t('book_reverse_geocode_error'));
            return;
          }
          setBookingData((prev) => ({
            ...prev,
            route: 'Custom Route',
            customOrigin: label.trim(),
            originCoords: [lat, lon],
          }));
        } catch {
          alert(t('book_geolocation_error'));
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        const code = (err as GeolocationPositionError)?.code;
        if (code === 1) alert(t('book_geolocation_denied'));
        else alert(t('book_geolocation_error'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 }
    );
  };

  const isFixedRouteValid = Boolean(
    bookingData.route &&
      bookingData.route !== 'Custom Route' &&
      PRICE_TABLE[bookingData.route]
  );
  const isCustomRouteValid = Boolean(
    bookingData.route === 'Custom Route' &&
      bookingData.customOrigin?.trim() &&
      bookingData.customDestination?.trim() &&
      bookingData.originCoords &&
      bookingData.destinationCoords
  );
  const step1CanProceed = Boolean(bookingData.dateTime) && (isFixedRouteValid || isCustomRouteValid);

  const handleNext = async () => {
    if (step === 4) {
      if (!isValidEmail(bookingData.email)) {
        alert(t('book_email_invalid'));
        return;
      }
      setIsLoading(true);
      try {
        const finalPrice = calculatePrice(bookingData.vehicleId, bookingData.paymentMethod === 'online');
        
        if (bookingData.paymentMethod === 'on_day') {
          const res = await fetch('/api/book-on-day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingData, price: finalPrice })
          });
          const data = await res.json();
          if (data.success) setStep(5);
          else alert(data.error === 'invalid_email' ? t('book_email_invalid') : t('book_error'));
        } else {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingData, price: finalPrice, locale })
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else
            alert(
              data.error === 'invalid_email'
                ? t('book_email_invalid')
                : typeof data.error === 'string'
                  ? data.error
                  : t('book_payment_error')
            );
        }
      } catch (e) {
        alert('An error occurred.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const commonInputStyles: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0',
    padding: '16px 20px',
    color: '#FFFFFF',
    fontSize: '15px',
    lineHeight: 1.45,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    letterSpacing: '0.06em',
    color: '#9A8070',
    fontWeight: 500,
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="animate-fade" style={{ animation: 'fadeIn 300ms ease-in-out' }}>
            <h2
              className="serif font-light text-white mb-10"
              style={{ fontSize: 'clamp(28px, 5vw, 42px)', marginTop: '20px', lineHeight: 1.15 }}
            >
              {t('book_route_title')}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block uppercase font-medium mb-2" style={labelStyle}>
                  {t('book_freq_dest')}
                </label>
                <select
                  className="w-full outline-none"
                  style={commonInputStyles}
                  value={bookingData.route}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      route: e.target.value,
                      customOrigin: '',
                      customDestination: '',
                      originCoords: null,
                      destinationCoords: null,
                    })
                  }
                >
                  <option value="" style={{ color: 'black' }}>
                    {t('book_select_route')}
                  </option>
                  {Object.keys(PRICE_TABLE).map((route) => (
                    <option key={route} value={route} style={{ color: 'black' }}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute w-full" style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <span
                  className="px-4 text-[10px] uppercase relative z-10"
                  style={{
                    backgroundColor: '#111111',
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {t('book_or')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AddressAutocomplete
                  placeholder={t('book_pickup_placeholder')}
                  value={bookingData.customOrigin}
                  onChange={(val, coords) =>
                    setBookingData({
                      ...bookingData,
                      customOrigin: val,
                      originCoords: coords || null,
                      route: 'Custom Route',
                    })
                  }
                  onGeolocate={requestPickupLocation}
                  geolocateLoading={geoLoading}
                  geolocateAriaLabel={t('book_use_my_location')}
                />
                <AddressAutocomplete
                  placeholder={t('book_dropoff_placeholder')}
                  value={bookingData.customDestination}
                  showEmptyStateIcon={false}
                  onChange={(val, coords) =>
                    setBookingData({
                      ...bookingData,
                      customDestination: val,
                      destinationCoords: coords || null,
                      route: 'Custom Route',
                    })
                  }
                />
              </div>
              {((bookingData.customOrigin && !bookingData.originCoords) ||
                (bookingData.customDestination && !bookingData.destinationCoords)) && (
                <p className="text-[15px] leading-relaxed" style={{ color: '#E5E7EB' }}>
                  {t('book_select_suggestion_hint')}
                </p>
              )}
              {customQuoteLoading &&
                bookingData.route === 'Custom Route' &&
                bookingData.originCoords &&
                bookingData.destinationCoords && (
                  <p className="text-[15px]" style={{ color: '#D1D5DB' }}>
                    {t('book_quote_calculating')}
                  </p>
                )}
              {customQuoteError && (
                <p className="text-[15px] leading-relaxed" style={{ color: '#FCA5A5' }}>
                  {customQuoteError}
                </p>
              )}
              {!bookingData.dateTime &&
                (isFixedRouteValid ||
                  (bookingData.route === 'Custom Route' &&
                    bookingData.originCoords &&
                    bookingData.destinationCoords)) && (
                  <p className="text-[15px] leading-relaxed" style={{ color: '#E5E7EB' }}>
                    {t('book_datetime_required')}
                  </p>
                )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="datetime-local"
                  className="w-full outline-none placeholder:text-neutral-400"
                  style={{ ...commonInputStyles, colorScheme: 'dark' }}
                  value={bookingData.dateTime}
                  onChange={(e) => setBookingData({ ...bookingData, dateTime: e.target.value })}
                />
                <select
                  className="w-full outline-none"
                  style={commonInputStyles}
                  value={bookingData.passengers}
                  onChange={(e) => setBookingData({ ...bookingData, passengers: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n} style={{ color: 'black' }}>
                      {t('book_passengers', { count: n })}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t('book_flight_placeholder')}
                  className="w-full outline-none placeholder:text-neutral-400"
                  style={commonInputStyles}
                  value={bookingData.flightRef}
                  onChange={(e) => setBookingData({ ...bookingData, flightRef: e.target.value })}
                />
              </div>
            </div>
            <button
              disabled={!step1CanProceed}
              onClick={handleNext}
              className="w-full uppercase hover-btn disabled:opacity-50"
              style={{
                backgroundColor: '#420F1A',
                color: '#FFFFFF',
                fontSize: '15px',
                letterSpacing: '0.1em',
                padding: '20px',
                borderRadius: '0',
                marginTop: '32px',
                border: 'none',
                transition: 'background-color 200ms ease',
              }}
            >
              {t('book_continue')}
            </button>
          </div>
        );
      case 2:
        const passengerCount = parseInt(bookingData.passengers);
        const filteredVehicles = VEHICLE_TYPES.filter(v => v.capacity >= passengerCount);

        return (
          <div className="animate-fade h-full flex flex-col" style={{ animation: 'fadeIn 300ms ease-in-out' }}>
            <h2 className="serif font-light text-white mb-6" style={{ fontSize: 'clamp(24px, 4vw, 32px)', lineHeight: 1.2 }}>
              {t('book_choose_vehicle')}
            </h2>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {filteredVehicles.map((v) => {
                const isSelected = bookingData.vehicleId === v.id;
                const price = basePrice > 0 ? calculatePrice(v.id, true) : null;

                return (
                  <div 
                    key={v.id} 
                    className="group relative flex items-center p-5 cursor-pointer transition-all rounded-none bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                    style={{
                      backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.05)' : '',
                      borderColor: isSelected ? '#D4AF37' : '',
                    }}
                    onClick={() => setBookingData({...bookingData, vehicleId: v.id})}
                  >
                    <div className="w-28 h-20 flex-shrink-0 mr-6 relative overflow-hidden rounded-none">
                      <img 
                        src={v.image} 
                        alt={v.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium text-white">{v.name}</h3>
                        <div className="flex items-center text-[11px] bg-white/10 px-2 py-0.5 rounded-none" style={{ color: '#E5E7EB' }}>
                          <Users size={10} className="mr-1 shrink-0" aria-hidden /> {v.capacity}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: '#D1D5DB' }}>
                        {t(v.subtitleKey)}
                      </p>
                    </div>

                    <div className="text-right pl-4">
                        <div className="text-xl font-semibold text-white">
                        {price ? `${price} €` : <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#F0D78C' }}>{t('book_quote_pending')}</span>}
                      </div>
                      {price && (
                        <div className="text-[10px] uppercase tracking-tighter mt-1" style={{ color: '#D1D5DB' }}>
                          TTC • {Math.round(price/1.1)}€ HT
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex space-x-4 mt-6 pt-6 border-t border-white/10">
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 uppercase font-bold text-[13px] tracking-[0.15em] py-4 rounded-none transition-all shadow-lg"
                style={{ backgroundColor: '#222222', color: '#FFFFFF' }}
              >
                RETOUR
              </button>
              <button 
                onClick={handleNext} 
                disabled={!bookingData.vehicleId || basePrice <= 0 || customQuoteLoading}
                className="flex-1 uppercase font-bold text-[13px] tracking-[0.15em] py-4 rounded-none transition-all shadow-2xl border border-[#D4AF37]/30 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#420F1A', color: '#FFFFFF' }}
              >
                CONTINUER
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade space-y-8" style={{ animation: 'fadeIn 300ms ease-in-out' }}>
            <h2 className="serif font-light text-white mb-8" style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.15 }}>
              {t('book_client_details')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block uppercase font-medium mb-2" style={labelStyle}>{t('book_full_name')} *</label>
                <input type="text" className="w-full outline-none placeholder:text-neutral-400" style={commonInputStyles} value={bookingData.fullName} onChange={e => setBookingData({...bookingData, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block uppercase font-medium mb-2" style={labelStyle}>{t('book_email')} *</label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full outline-none placeholder:text-neutral-400"
                  placeholder={t('book_email_placeholder')}
                  style={commonInputStyles}
                  value={bookingData.email}
                  onChange={e => setBookingData({ ...bookingData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block uppercase font-medium mb-2" style={labelStyle}>{t('book_phone')} *</label>
                <input type="tel" className="w-full outline-none placeholder:text-neutral-400" placeholder="+33" style={commonInputStyles} value={bookingData.phone} onChange={e => setBookingData({...bookingData, phone: e.target.value})} />
              </div>
              <div className="col-span-full space-y-2">
                <label className="block uppercase font-medium mb-2" style={labelStyle}>{t('book_special_notes')}</label>
                <textarea className="w-full outline-none h-32 placeholder:text-neutral-400" style={commonInputStyles} value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex space-x-4 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 uppercase" style={{ ...commonInputStyles, fontSize: '12px', letterSpacing: '0.1em', textAlign: 'center' }}>{t('book_back')}</button>
              <button
                disabled={!bookingData.fullName || !bookingData.phone || !isValidEmail(bookingData.email)}
                onClick={handleNext}
                className="flex-1 uppercase hover-btn text-white disabled:opacity-50"
                style={{ backgroundColor: '#420F1A', fontSize: '14px', letterSpacing: '0.1em', borderRadius: '0' }}
              >
                {t('book_step_5')}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade space-y-8" style={{ animation: 'fadeIn 300ms ease-in-out' }}>
            <h2 className="serif font-light text-white mb-8" style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.15 }}>
              {t('book_payment_mode')}
            </h2>
            <div className="space-y-4">
              <div 
                className="p-6 cursor-pointer flex justify-between items-center transition-all rounded-none"
                style={{
                  backgroundColor: bookingData.paymentMethod === 'online' ? 'rgba(66, 15, 26, 0.4)' : 'rgba(255,255,255,0.02)',
                  border: bookingData.paymentMethod === 'online' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
                }}
                onClick={() => setBookingData({...bookingData, paymentMethod: 'online'})}
              >
                <div>
                  <h3 className="serif text-xl flex items-center gap-2 text-white">
                    {t('book_pay_now')}
                    <span className="text-white px-2 py-0.5 uppercase font-bold" style={{ fontSize: '10px', backgroundColor: '#420F1A' }}>{t('book_reduced_rate')}</span>
                  </h3>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: '#D1D5DB' }}>{t('book_immediate_conf')}</p>
                </div>
                <div className="text-2xl serif font-bold text-white">{calculatePrice(bookingData.vehicleId, true)} €</div>
              </div>
              <div 
                className="p-6 cursor-pointer flex justify-between items-center transition-all rounded-none"
                style={{
                  backgroundColor: bookingData.paymentMethod === 'on_day' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  border: bookingData.paymentMethod === 'on_day' ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.05)',
                }}
                onClick={() => setBookingData({...bookingData, paymentMethod: 'on_day'})}
              >
                <div>
                  <h3 className="serif text-xl text-white">{t('book_pay_driver')}</h3>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: '#D1D5DB' }}>{t('book_cash_card')}</p>
                </div>
                <div className="text-2xl serif font-bold text-white">{calculatePrice(bookingData.vehicleId, false)} €</div>
              </div>
            </div>
            <div className="flex space-x-4 mt-8">
              <button onClick={() => setStep(3)} className="flex-1 uppercase" style={{ ...commonInputStyles, fontSize: '12px', letterSpacing: '0.1em', textAlign: 'center' }}>{t('book_back')}</button>
              <button disabled={!bookingData.paymentMethod || isLoading} onClick={handleNext} className="flex-1 uppercase hover-btn text-white disabled:opacity-50" style={{ backgroundColor: '#420F1A', fontSize: '14px', letterSpacing: '0.1em', borderRadius: '0' }}>
                {isLoading ? t('book_processing') : t('book_confirm_booking')}
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-fade space-y-12 text-center py-12" style={{ animation: 'fadeIn 300ms ease-in-out' }}>
            <div className="flex justify-center">
              <div className="rounded-none p-6 text-white" style={{ backgroundColor: '#420F1A' }}>
                <Check size={48} />
              </div>
            </div>
            <div>
              <h2 className="serif text-5xl mb-4 text-white">{t('book_confirmed_title')}</h2>
              <p className="text-xl max-w-md mx-auto leading-relaxed" style={{ color: '#E5E7EB' }}>
                {t('book_confirmed_desc')}
              </p>
            </div>
            <Link href="/" className="inline-block uppercase text-white px-12 hover-btn mt-8" style={{ backgroundColor: '#420F1A', padding: '20px', letterSpacing: '0.1em', fontWeight: 500, borderRadius: '0' }}>
              {t('book_return_home')}
            </Link>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <main className="min-h-screen pt-0 pb-12 px-4 md:px-8 flex flex-col items-center relative overflow-hidden" style={{
      background: '#0a0a0a',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(66, 15, 26, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(212, 175, 55, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(20, 20, 22, 1) 0px, transparent 100%),
        radial-gradient(at 0% 100%, rgba(66, 15, 26, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(20, 20, 20, 1) 0px, transparent 50%)
      `
    }}>
      {/* Premium Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay'
      }} />

      {/* Dynamic Light Streaks */}
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white/[0.02] blur-[150px] rounded-none pointer-events-none" />

      {/* Physical spacer for Navbar */}
      <div style={{ height: '160px', width: '100%', position: 'relative', zIndex: 1 }} />

      {stripeEmailNotice ? (
        <div
          role="alert"
          className="w-full max-w-[1400px] mb-3 px-2"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <div
            className="rounded-none border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100"
            style={{ letterSpacing: '0.02em' }}
          >
            {stripeEmailNotice}
          </div>
        </div>
      ) : null}

      <div className={`w-full max-w-[1400px] flex flex-col ${step === 2 ? 'md:flex-row' : 'md:flex-row'} gap-6 md:gap-8`}>
        
        {/* LEFT COLUMN: ROUTE SUMMARY */}
        <div className={`${step === 2 ? 'md:w-[280px] h-fit' : 'md:w-[500px] h-full'} flex flex-col bg-[#111111] rounded-none shadow-2xl overflow-hidden border border-white/5 transition-all duration-500`} style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div className="p-6 md:p-8 flex flex-col">
            {step === 2 ? (
              <div className="animate-fade flex flex-col space-y-8">
                <div className="flex flex-col pt-2 px-1">
                  {/* Ligne dorée signature */}
                  <div className="w-full mb-8" style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #C9A84C 60%, transparent)'
                  }} />

                  {/* Titre */}
                  <p className="uppercase font-light mb-6 px-2" style={{
                    fontSize: '9px',
                    letterSpacing: '0.28em',
                    color: '#C9A84C'
                  }}>
                    Résumé de la course
                  </p>

                  {/* Trajet */}
                  <div className="flex gap-4 mb-6 px-2" style={{ alignItems: 'stretch' }}>
                    <div className="flex flex-col items-center">
                      <div style={{ width: '8px', height: '8px', borderRadius: 0, background: '#C9A84C', flexShrink: 0 }} />
                      <div style={{ width: '1px', flex: 1, minHeight: '28px', background: '#3A3A3C', margin: '4px 0' }} />
                      <div style={{ width: '8px', height: '8px', borderRadius: 0, border: '1.5px solid #C9A84C', flexShrink: 0 }} />
                    </div>

                    <div className="flex flex-col justify-between flex-1 py-[1px]">
                      <span className="font-light" style={{ fontSize: '14px', color: '#F2F2F7', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                        {bookingData.route !== 'Custom Route' ? bookingData.route.split(' → ')[0] : (bookingData.customOrigin || 'Adresse non spécifiée')}
                      </span>
                      <span className="font-light" style={{ fontSize: '14px', color: '#F2F2F7', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                        {bookingData.route !== 'Custom Route' ? bookingData.route.split(' → ')[1] : (bookingData.customDestination || 'Adresse non spécifiée')}
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '0.5px', background: '#2C2C2E', margin: '0 0 18px 0' }} />

                  {/* Chips */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex items-center gap-2" style={{ flex: 1, background: '#1c1c1e', borderRadius: 0, padding: '10px 8px', justifyContent: 'center' }}>
                      <Users size={11} color="#A3A3A3" />
                      <div>
                        <div style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A3A3A3', marginBottom: '3px' }}>Passagers</div>
                        <div style={{ fontSize: '13px', color: '#F2F2F7', fontWeight: 300 }}>{bookingData.passengers}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" style={{ flex: 1, background: '#1c1c1e', borderRadius: 0, padding: '10px 8px', justifyContent: 'center' }}>
                      <Clock size={11} color="#A3A3A3" />
                      <div>
                        <div style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A3A3A3', marginBottom: '3px' }}>Départ</div>
                        <div style={{ fontSize: '13px', color: '#F2F2F7', fontWeight: 300 }}>
                          {bookingData.dateTime ? new Date(bookingData.dateTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image du véhicule sélectionné */}
                  {bookingData.vehicleId && (
                    <div className="mb-4 animate-fade px-2">
                      <div className="relative h-32 w-full overflow-hidden rounded-none border border-white/5 bg-white/5 shadow-2xl">
                        <img 
                          src={VEHICLE_TYPES.find(v => v.id === bookingData.vehicleId)?.image} 
                          alt="Véhicule sélectionné"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <div className="text-[8px] uppercase tracking-[0.2em] text-[#C9A84C] font-bold mb-0.5 opacity-80">Sélectionné</div>
                          <div className="text-xs text-white font-medium tracking-wide">
                            {VEHICLE_TYPES.find(v => v.id === bookingData.vehicleId)?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setStep(1)} 
                  className="w-full rounded-none border border-[#C9A84C]/20 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A84C] transition-all duration-300 hover:bg-[#C9A84C] hover:text-white"
                >
                  Modifier le trajet
                </button>
              </div>
            ) : (
              <div className="flex-grow">
                {renderStep()}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN (Only for Step 2) */}
        {step === 2 && (
          <div className="flex-1 flex flex-col bg-[#111111] rounded-none shadow-2xl overflow-hidden border border-white/5 p-6 md:p-8 animate-fade" style={{
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animationDelay: '100ms'
          }}>
            {renderStep()}
          </div>
        )}

        {/* RIGHT COLUMN (MAP) */}
        <div className={`transition-all duration-500 ${step === 2 ? 'md:w-[400px]' : 'flex-1'} rounded-none overflow-hidden relative border border-white/5 shadow-2xl mt-8 md:mt-0 h-[400px] md:h-[600px]`}>
          <BookingMap
            routeStr={bookingData.route}
            originCoords={bookingData.originCoords}
            destinationCoords={bookingData.destinationCoords}
          />
        </div>

      </div>
      <style jsx>{`
        .hover-btn:hover {
          background-color: #5a1423 !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #D4AF37 !important;
          background-color: rgba(255,255,255,0.06) !important;
        }
      `}</style>
    </main>
  );
}
