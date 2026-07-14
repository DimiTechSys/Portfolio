'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { Car, MapPin, ArrowRight, Star, Shield, Clock } from 'lucide-react';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Hover state to control brightness precisely
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);

  return (
    <main style={{ backgroundColor: '#0D0D0D', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════
          HERO — BRAND IDENTITY
      ═══════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1800&q=80&auto=format&fit=crop')",
          backgroundSize: 'cover', backgroundPosition: 'center 55%',
          filter: 'grayscale(0.5) brightness(0.22)',
        }} />
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.05) 0%, rgba(13,13,13,0.7) 55%, rgba(13,13,13,1) 100%)',
        }} />
        {/* Gold horizontal lines — top & bottom */}
        <div style={{ position: 'absolute', top: '72px', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 5%, rgba(212,175,55,0.2) 40%, rgba(212,175,55,0.2) 60%, transparent 95%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 5%, rgba(212,175,55,0.12) 40%, rgba(212,175,55,0.12) 60%, transparent 95%)' }} />
        {/* Vertical gold accent line */}
        <div style={{ position: 'absolute', top: '72px', bottom: 0, left: '50%', width: '1px', background: 'linear-gradient(to bottom, rgba(212,175,55,0.12), transparent 30%)', transform: 'translateX(-50%)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 32px', maxWidth: '900px' }}>
          {/* Eyebrow */}
          <div className="sans" style={{
            fontSize: '10px', letterSpacing: '0.55em', color: 'rgba(212,175,55,0.55)',
            fontWeight: 600, marginBottom: '48px', textTransform: 'uppercase',
          }}>
            {t('home_since')}
          </div>

          {/* Brand name — cinematic */}
          <div style={{ marginBottom: '32px' }}>
            <div className="serif" style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: 'clamp(56px, 8vw, 110px)',
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              display: 'block',
            }}>
              Capitale
            </div>
            <div className="serif" style={{
              color: '#D4AF37',
              fontSize: 'clamp(56px, 8vw, 110px)',
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              fontStyle: 'italic',
              display: 'block',
            }}>
              Transfer
            </div>
          </div>

          {/* Gold ornament */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.5))' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#D4AF37', transform: 'rotate(45deg)', opacity: 0.7 }} />
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.5))' }} />
          </div>

          {/* Tagline */}
          <p className="sans" style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: '15px', letterSpacing: '0.08em',
            maxWidth: '440px', margin: '0 auto 64px',
            lineHeight: 1.9, fontStyle: 'italic',
          }}>
            {t('home_tagline')}
          </p>

          {/* Scroll invite */}
          <a href="#services" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <span className="sans" style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#CFBB7A', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('home_discover')}
            </span>
            <div style={{ width: '1px', height: '56px', background: 'linear-gradient(to bottom, rgba(212,175,55,0.5), transparent)' }} />
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SERVICES — SPLIT CARDS
      ═══════════════════════════════════════ */}
      <section id="services">
        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', padding: '96px 24px 64px' }}>
          <div className="sans" style={{ fontSize: '9px', letterSpacing: '0.55em', color: 'rgba(212,175,55,0.5)', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase' }}>
            {t('home_our_services')}
          </div>
          <h2 className="serif" style={{ color: '#FFFFFF', fontSize: 'clamp(30px, 3.5vw, 50px)', fontWeight: 300, lineHeight: 1.2, marginBottom: '0' }}>
            {t('home_choose')}
          </h2>
          {/* Ornement */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <div style={{ height: '1px', width: '40px', background: 'rgba(212,175,55,0.3)' }} />
            <div style={{ width: '3px', height: '3px', backgroundColor: 'rgba(212,175,55,0.5)', transform: 'rotate(45deg)' }} />
            <div style={{ height: '1px', width: '40px', background: 'rgba(212,175,55,0.3)' }} />
          </div>
        </div>

        {/* Cards */}
        <div className="services-grid">

          {/* Card 1 — Chauffeur */}
          <Link 
            href="/services/chauffeur" 
            className="svc-card" 
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ textDecoration: 'none', position: 'relative', overflow: 'hidden' }}
          >
            <div 
              className="svc-bg" 
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=2000')",
                filter: hoveredCard === 1 ? 'grayscale(0.1) brightness(0.65)' : 'grayscale(0.2) brightness(0.4)',
                transform: hoveredCard === 1 ? 'scale(1.08)' : 'scale(1)',
              }} 
            />
            <div className="svc-gradient" style={{ opacity: hoveredCard === 1 ? 0.75 : 0.92 }} />
            <div className="svc-body" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="svc-icon">
                <Car size={20} strokeWidth={1.3} color="#D4AF37" />
              </div>
              <div className="sans" style={{ fontSize: '9px', letterSpacing: '0.4em', color: 'rgba(212,175,55,0.65)', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase' }}>
                {t('service_chauffeur_tag')}
              </div>
              <h3 className="serif svc-title">
                <span style={{ display: 'block' }}>{t('service_chauffeur_title_1')}</span>
                <span style={{ display: 'block', color: '#D4AF37', fontStyle: 'italic' }}>{t('service_chauffeur_title_2')}</span>
              </h3>
              <div className="svc-divider" />
              <p className="sans svc-desc">{t('service_chauffeur_desc')}</p>
              <div className="svc-tags">
                {[t('tag_airport'), t('tag_corporate'), t('tag_long_distance'), t('tag_bespoke')].map((tag) => (
                   <span key={tag} className="sans svc-tag">{tag}</span>
                ))}
              </div>
              <div className="svc-cta sans">
                {t('home_explore')} <ArrowRight size={13} />
              </div>
            </div>
            <div className="svc-border" />
          </Link>

          {/* Card 2 — Tourism */}
          <Link 
            href="/services/tourism" 
            className="svc-card" 
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ textDecoration: 'none', position: 'relative', overflow: 'hidden' }}
          >
            <div 
              className="svc-bg" 
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2000')",
                filter: hoveredCard === 2 ? 'grayscale(0.1) brightness(0.65)' : 'grayscale(0.2) brightness(0.4)',
                transform: hoveredCard === 2 ? 'scale(1.08)' : 'scale(1)',
              }} 
            />
            <div className="svc-gradient" style={{ opacity: hoveredCard === 2 ? 0.75 : 0.92 }} />
            <div className="svc-body" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="svc-icon">
                <MapPin size={20} strokeWidth={1.3} color="#D4AF37" />
              </div>
              <div className="sans" style={{ fontSize: '9px', letterSpacing: '0.4em', color: 'rgba(212,175,55,0.65)', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase' }}>
                {t('service_tourism_tag')}
              </div>
              <h3 className="serif svc-title">
                <span style={{ display: 'block' }}>{t('service_tourism_title_1')}</span>
                <span style={{ display: 'block', color: '#D4AF37', fontStyle: 'italic' }}>{t('service_tourism_title_2')}</span>
              </h3>
              <div className="svc-divider" />
              <p className="sans svc-desc">{t('service_tourism_desc')}</p>
              <div className="svc-tags">
                {[t('tag_versailles'), t('tag_champagne'), t('tag_gastronomy'), t('tag_night')].map((tag) => (
                  <span key={tag} className="sans svc-tag">{tag}</span>
                ))}
              </div>
              <div className="svc-cta sans">
                {t('home_explore')} <ArrowRight size={13} />
              </div>
            </div>
            <div className="svc-border" />
          </Link>

        </div>
      </section>

      {/* ═══════════════════════════════════════
          BRAND PILLARS
      ═══════════════════════════════════════ */}
      <section style={{ padding: '120px 0 100px', borderTop: '1px solid rgba(212,175,55,0.07)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <h2 className="serif reveal" style={{ color: '#FFFFFF', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 300, textAlign: 'center', marginBottom: '72px' }}>
            {t('home_why_choose')}
          </h2>
          <div className="pillars-grid">
            {[
              { icon: <Shield size={26} strokeWidth={1.3} />, title: t('pillar_1_title'), desc: t('pillar_1_desc') },
              { icon: <Clock size={26} strokeWidth={1.3} />, title: t('pillar_2_title'), desc: t('pillar_2_desc') },
              { icon: <Star size={26} strokeWidth={1.3} />, title: t('pillar_3_title'), desc: t('pillar_3_desc') },
            ].map((p, i) => (
              <div key={i} className={`pillar-card reveal reveal-delay-${i + 1}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div style={{ color: '#D4AF37', marginBottom: '24px', opacity: 0.8 }}>{p.icon}</div>
                <div style={{ width: '24px', height: '1px', backgroundColor: 'rgba(212,175,55,0.4)', marginBottom: '20px' }} />
                <h3 className="serif" style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 400, marginBottom: '14px', lineHeight: 1.4 }}>{p.title}</h3>
                <p className="sans" style={{ color: '#9E9E9E', fontSize: '14px', lineHeight: 1.85 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <section style={{
        position: 'relative', padding: '140px 40px', textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, #0D0D0D 0%, #1a0b0e 50%, #0D0D0D 100%)',
        }} />
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          border: '1px solid rgba(212,175,55,0.06)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px', height: '400px', borderRadius: '50%',
          border: '1px solid rgba(212,175,55,0.04)',
          pointerEvents: 'none',
        }} />

        <div className="reveal" style={{ position: 'relative', zIndex: 5, maxWidth: '640px', margin: '0 auto' }}>
          <div className="sans" style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#CFBB7A', fontWeight: 700, marginBottom: '28px', textTransform: 'uppercase' }}>
            {t('home_ready')}
          </div>
          <h2 className="serif" style={{ color: '#FFFFFF', fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: 300, lineHeight: 1.25, marginBottom: '24px' }}>
            {t('home_final_title')}
          </h2>
          <p className="sans" style={{ color: '#B0B0B0', fontSize: '15px', lineHeight: 1.9, marginBottom: '56px' }}>
            {t('home_final_desc')}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" className="sans" style={{
              backgroundColor: '#420F1A', color: '#D4AF37',
              padding: '18px 52px', fontSize: '11px', fontWeight: 800,
              letterSpacing: '0.25em', textTransform: 'uppercase',
              textDecoration: 'none', display: 'inline-block',
            }}>
              {t('cta_book')}
            </Link>
            <Link href="/contact" className="sans" style={{
              border: '1px solid rgba(212,175,55,0.35)', color: '#CFBB7A',
              padding: '18px 40px', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              textDecoration: 'none', display: 'inline-block', backgroundColor: 'transparent',
            }}>
              {t('home_contact_concierge')}
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* ── Service grid ── */
        .services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 88vh;
          border-top: 1px solid rgba(212,175,55,0.07);
        }
        .svc-card {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          cursor: pointer;
          border-right: 1px solid rgba(212,175,55,0.07);
        }
        .svc-card:last-child { border-right: none; }
        .svc-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1), filter 0.8s ease-in-out;
        }
        .svc-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.65) 45%, rgba(13,13,13,0) 100%);
          transition: opacity 0.5s ease;
        }
        .svc-body {
          position: relative; z-index: 10;
          padding: 72px 64px;
          display: flex; flex-direction: column;
        }
        .svc-icon {
          width: 48px; height: 48px;
          border: 1px solid rgba(212,175,55,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 32px;
          transition: border-color 0.35s ease, background 0.35s ease;
        }
        .svc-card:hover .svc-icon {
          border-color: rgba(212,175,55,0.55);
          background: rgba(212,175,55,0.07);
        }
        .svc-title {
          color: #FFFFFF;
          font-size: clamp(32px, 3.5vw, 56px);
          font-weight: 300;
          line-height: 1.05;
          margin-bottom: 0;
        }
        .svc-divider {
          width: 32px; height: 1px;
          background: rgba(212,175,55,0.35);
          margin: 28px 0;
          transition: width 0.4s ease;
        }
        .svc-card:hover .svc-divider { width: 56px; }
        .svc-desc {
          color: rgba(255,255,255,0.58);
          font-size: 15px; line-height: 1.8;
          max-width: 380px;
          margin-bottom: 32px;
        }
        .svc-tags {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 36px;
        }
        .svc-tag {
          border: 1px solid rgba(212,175,55,0.22);
          color: #CFBB7A;
          padding: 5px 14px; font-size: 9px;
          font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: border-color 0.3s ease, color 0.3s ease;
        }
        .svc-card:hover .svc-tag {
          border-color: rgba(212,175,55,0.35);
          color: rgba(212,175,55,0.8);
        }
        .svc-cta {
          display: inline-flex; align-items: center; gap: 10px;
          color: #CFBB7A;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          transition: gap 0.35s ease, color 0.3s ease;
        }
        .svc-card:hover .svc-cta { gap: 18px; color: #D4AF37; }
        .svc-border {
          position: absolute; inset: 0;
          border: 0px solid rgba(212,175,55,0);
          transition: border 0.4s ease;
          pointer-events: none; z-index: 20;
        }
        .svc-card:hover .svc-border {
          border: 1px solid rgba(212,175,55,0.22);
        }

        /* ── Pillars ── */
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(212,175,55,0.07);
        }
        .pillar-card {
          padding: 52px 44px;
          background: #0D0D0D;
          border-top: 2px solid transparent;
          transition: border-top-color 0.35s ease;
        }
        .pillar-card:hover { border-top-color: rgba(212,175,55,0.4); }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .services-grid { grid-template-columns: 1fr; min-height: auto; }
          .svc-card { min-height: 75vh; border-right: none; border-bottom: 1px solid rgba(212,175,55,0.07); }
          .svc-body { padding: 48px 36px; }
          .pillars-grid { grid-template-columns: 1fr; }
          .pillar-card { padding: 40px 28px; }
        }
        @media (max-width: 540px) {
          .svc-body { padding: 40px 24px; }
        }
      `}</style>
    </main>
  );
}
