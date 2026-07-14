'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { Users, Shield, Clock, Star, MapPin, Wine, Camera, Moon, Plane, UtensilsCrossed, Car, Map } from 'lucide-react';

import { useTranslations, useLocale } from 'next-intl';
import { getTourismExperiences } from '@/lib/tourismData';

const experienceIcons: Record<string, any> = {
  'private-tour': <MapPin size={16} />,
  'car-tour': <Car size={16} />,
  'museums': <Camera size={16} />,
  'day-trips': <Map size={16} />,
  'night': <Moon size={16} />,
  'gastro': <UtensilsCrossed size={16} />,
  'champagne': <Wine size={16} />,
  'families': <Users size={16} />,
  'couple': <Star size={16} />,
  'solo': <MapPin size={16} />,
  'historical': <Camera size={16} />,
  'custom': <Shield size={16} />
};

const stats = [
  { value: '+500', labelKey: 'tourism_stat_1_label' },
  { value: '12', labelKey: 'tourism_stat_2_label' },
  { value: '24/7', labelKey: 'tourism_stat_3_label' },
];

const promises = [
  { icon: <Shield size={28} />, titleKey: 'pillar_1_title', descKey: 'pillar_1_desc' },
  { icon: <Clock size={28} />, titleKey: 'pillar_2_title', descKey: 'pillar_2_desc' },
  { icon: <Star size={28} />, titleKey: 'pillar_3_title', descKey: 'pillar_3_desc' },
];

export default function TourismPage() {
  const t = useTranslations();
  const locale = useLocale();
  const rawExperiences = getTourismExperiences(locale);
  const experiences = Object.values(rawExperiences);
  return (
    <main style={{ backgroundColor: '#1D1D1D' }}>

      {/* ─── SECTION 1 : HERO ─── */}
      <section
        className="tourism-hero"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=85&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        />
        {/* Overlay gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(29,29,29,0.92) 0%, rgba(29,29,29,0.75) 50%, rgba(66,15,26,0.45) 100%)',
        }} />

        {/* Badge */}
        <div style={{ position: 'relative', zIndex: 10, padding: '0 8vw', paddingTop: '120px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#D4AF37',
            color: '#1D1D1D',
            padding: '8px 20px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '40px',
          }} className="sans">
            <Star size={12} />
            {t('tourism_hero_badge')}
          </div>

          <h1
            className="serif"
            style={{
              color: '#FFFFFF',
              fontSize: 'clamp(52px, 7vw, 96px)',
              fontWeight: 300,
              lineHeight: 1.05,
              maxWidth: '800px',
              marginBottom: '32px',
            }}
          >
            {t('tourism_hero_title_1')}<br />
            <em style={{ color: '#D4AF37', fontStyle: 'italic' }}>{t('tourism_hero_title_2')}</em>
          </h1>

          <p
            className="sans"
            style={{
              color: '#C0C0C0',
              fontSize: '18px',
              lineHeight: 1.8,
              maxWidth: '540px',
              marginBottom: '56px',
            }}
          >
            {t('tourism_hero_subtitle')}
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              className="sans uppercase"
              style={{
                backgroundColor: '#420F1A',
                color: '#D4AF37',
                padding: '20px 48px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.3s ease',
              }}
            >
              {t('tourism_cta_concierge')}
            </Link>
            <a
              href="#experiences"
              className="sans uppercase"
              style={{
                border: '1px solid rgba(212,175,55,0.4)',
                color: '#D4AF37',
                padding: '20px 40px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textDecoration: 'none',
                display: 'inline-block',
                backgroundColor: 'transparent',
                transition: 'all 0.3s ease',
              }}
            >
              {t('tourism_cta_discover')}
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.4,
        }}>
          <div style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, transparent, #D4AF37)' }} />
        </div>
      </section>

      {/* ─── SECTION 2 : STATS ─── */}
      <section style={{ backgroundColor: '#111111', borderTop: '1px solid rgba(212,175,55,0.15)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }} className="stats-grid">
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '56px 40px',
                textAlign: 'center',
                borderRight: i < stats.length - 1 ? '1px solid rgba(212,175,55,0.12)' : 'none',
              }}
            >
              <div
                className="serif"
                style={{ fontSize: 'clamp(44px, 5vw, 64px)', color: '#D4AF37', fontWeight: 300, lineHeight: 1, marginBottom: '12px' }}
              >
                {s.value}
              </div>
              <div
                className="sans uppercase"
                style={{ fontSize: '11px', color: '#888', letterSpacing: '0.2em', fontWeight: 600 }}
              >
                {t(s.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 3 : EXPÉRIENCES ─── */}
      <section id="experiences" style={{ padding: '140px 0', backgroundColor: '#1D1D1D' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div className="sans uppercase" style={{ fontSize: '11px', letterSpacing: '0.35em', color: '#D4AF37', fontWeight: 600, marginBottom: '20px' }}>
              {t('tourism_cta_discover')}
            </div>
            <h2 className="serif" style={{ color: '#FFFFFF', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 300, lineHeight: 1.2, marginBottom: '20px' }}>
              {t('tourism_exp_title')}
            </h2>
            <p className="sans" style={{ color: '#888', fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.8 }}>
              {t('tourism_exp_subtitle')}
            </p>
          </div>

          {/* Grid */}
          <div className="exp-grid">
            {experiences.map((exp) => (
              <div key={exp.id} className="exp-card">
                {/* Image */}
                <Link href={`/services/tourism/${exp.id}`}>
                  <div className="exp-image-wrapper">
                    <div className="exp-image-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={exp.image}
                        alt={exp.title}
                        className="exp-image"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          // Fallback to a working luxury image if Unsplash fails
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80';
                        }}
                      />
                    </div>
                    <div className="exp-overlay" />
                    {/* Badge */}
                    <div className="exp-badge sans uppercase">
                      {exp.badge}
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <div className="exp-content">
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', opacity: 0.7 }}>
                    {experienceIcons[exp.id]}
                  </div>
                  <h3 className="serif" style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 300, marginBottom: '16px', letterSpacing: '0.02em', minHeight: '60px', display: 'flex', alignItems: 'center' }}>
                    {exp.title}
                  </h3>
                  <p className="sans" style={{ color: '#A0A0A0', fontSize: '14px', lineHeight: 1.8, marginBottom: '32px', flexGrow: 1, letterSpacing: '0.01em' }}>
                    {exp.subtitle}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="sans" style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600 }}>
                      {exp.id === 'custom' ? t('tourism_reserve') : t('from_price', { price: exp.price })}
                    </span>
                    <Link
                      href={`/services/tourism/${exp.id}`}
                      className="sans"
                      style={{
                        color: '#D4AF37',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {t('home_discover')} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 : NOTRE PROMESSE ─── */}
      <section style={{ position: 'relative', padding: '160px 0', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&q=80&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(0.4)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(29,29,29,0.97) 40%, rgba(29,29,29,0.7) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
          {/* Quote */}
          <div style={{ maxWidth: '600px', marginBottom: '80px' }}>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#D4AF37', marginBottom: '32px' }} />
            <h2 className="serif" style={{
              color: '#FFFFFF',
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 300,
              lineHeight: 1.4,
              fontStyle: 'italic',
              marginBottom: '24px',
            }}>
              {t('tourism_quote').split('<br />').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < t('tourism_quote').split('<br />').length - 1 && <br />}
                </React.Fragment>
              ))}
            </h2>
            <p className="sans" style={{ color: '#9A8070', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              {t('tourism_quote_author')}
            </p>
          </div>

          {/* 3 pillars */}
          <div className="promise-grid">
            {promises.map((p, i) => (
              <div key={i} className="promise-item">
                <div style={{ color: '#D4AF37', marginBottom: '20px', opacity: 0.9 }}>
                  {p.icon}
                </div>
                <h3 className="serif" style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 400, marginBottom: '12px' }}>
                  {t(p.titleKey)}
                </h3>
                <p className="sans" style={{ color: '#888', fontSize: '14px', lineHeight: 1.7 }}>
                  {t(p.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5 : CTA CONCIERGE ─── */}
      <section style={{ backgroundColor: '#420F1A', padding: '120px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '0 40px' }}>
          <div className="sans uppercase" style={{ fontSize: '10px', letterSpacing: '0.4em', color: 'rgba(212,175,55,0.6)', fontWeight: 600, marginBottom: '24px' }}>
            {t('tourism_hero_badge')}
          </div>
          <h2 className="serif" style={{
            color: '#FFFFFF',
            fontSize: 'clamp(32px, 4vw, 54px)',
            fontWeight: 300,
            lineHeight: 1.3,
            marginBottom: '24px',
          }}>
            {t('tourism_custom_title').split('<br />').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < t('tourism_custom_title').split('<br />').length - 1 && <br />}
              </React.Fragment>
            ))}
          </h2>
          <p className="sans" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.8, marginBottom: '52px', maxWidth: '520px', margin: '0 auto 52px' }}>
            {t('tourism_custom_desc')}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              className="sans uppercase"
              style={{
                backgroundColor: '#D4AF37',
                color: '#1D1D1D',
                padding: '20px 52px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {t('tourism_cta_concierge')}
            </Link>
            <Link
              href="/book"
              className="sans uppercase"
              style={{
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                padding: '20px 40px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textDecoration: 'none',
                display: 'inline-block',
                backgroundColor: 'transparent',
              }}
            >
              {t('nav_booking')}
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* ─── Hero ─── */
        .tourism-hero a:hover {
          filter: brightness(1.15);
        }

        /* ─── Stats grid ─── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ─── Experiences ─── */
        .exp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .exp-card {
          background-color: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          transition: all 0.35s ease;
          overflow: hidden;
          height: 100%;
        }
        .exp-card:hover {
          border-color: rgba(212,175,55,0.25);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          transform: translateY(-6px);
        }
        .exp-image-wrapper {
          position: relative;
          height: 300px;
          overflow: hidden;
          display: block;
        }
        .exp-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.2, 1, 0.3, 1);
          filter: grayscale(0.2) brightness(0.9);
        }
        .exp-card:hover .exp-image {
          transform: scale(1.08);
          filter: grayscale(0);
        }
        .exp-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(29,29,29,0.7) 0%, transparent 60%);
        }
        .exp-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background-color: #D4AF37;
          color: #1D1D1D;
          padding: 5px 14px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.2em;
        }
        .exp-content {
          padding: 28px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        /* ─── Promise grid ─── */
        .promise-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }
        .promise-item {
          padding: 36px;
          border: 1px solid rgba(212,175,55,0.12);
          background-color: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
        }

        /* ─── Responsive ─── */
        @media (max-width: 1024px) {
          .exp-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .promise-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .exp-grid {
            grid-template-columns: 1fr;
          }
          .promise-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
