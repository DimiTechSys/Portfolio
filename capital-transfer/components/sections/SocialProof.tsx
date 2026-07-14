'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

const SocialProof: React.FC = () => {
  const t = useTranslations();

  const testimonials = [
    {
      name: 'Alexandre M.',
      role: t('testimonial_1_role'),
      city: t('testimonial_1_city'),
      text: t('testimonial_1_text'),
      stars: 5,
      initials: 'AM',
    },
    {
      name: 'Sophia Al-R.',
      role: t('testimonial_2_role'),
      city: t('testimonial_2_city'),
      text: t('testimonial_2_text'),
      stars: 5,
      initials: 'SA',
    },
    {
      name: 'Jérôme F.',
      role: t('testimonial_3_role'),
      city: t('testimonial_3_city'),
      text: t('testimonial_3_text'),
      stars: 5,
      initials: 'JF',
    },
    {
      name: 'Catherine V.',
      role: t('testimonial_4_role'),
      city: t('testimonial_4_city'),
      text: t('testimonial_4_text'),
      stars: 5,
      initials: 'CV',
    },
    {
      name: 'Thomas K.',
      role: t('testimonial_5_role'),
      city: t('testimonial_5_city'),
      text: t('testimonial_5_text'),
      stars: 5,
      initials: 'TK',
    },
  ];

  const hotelPartners = [
    'Hôtel de Crillon',
    'Le Meurice',
    'Four Seasons George V',
    'Hôtel Lutetia',
  ];

  return (
    <section style={{ backgroundColor: '#0D0D0D', padding: '140px 0', borderTop: '1px solid rgba(212,175,55,0.07)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="sans" style={{ fontSize: '9px', letterSpacing: '0.55em', color: 'rgba(212,175,55,0.5)', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase' }}>
            {t('sp_trust_title')}
          </div>
          <h2 className="serif" style={{ color: '#FFFFFF', fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 300, lineHeight: 1.2 }}>
            {t('sp_clients_title')}
          </h2>
          <div className="gold-sep" style={{ marginTop: '24px' }}>
            <div className="gold-sep-diamond" />
          </div>
        </div>

        {/* Testimonials — 3 top + 2 bottom centered */}
        <div className="sp-grid-top">
          {testimonials.slice(0, 3).map((t, i) => (
            <div key={t.name} className={`reveal reveal-delay-${i + 1} sp-card`}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                {[...Array(5)].map((_, si) => (
                  <span key={si} style={{ color: '#D4AF37', fontSize: '13px' }}>★</span>
                ))}
              </div>
              {/* Quote */}
              <p className="serif sp-quote">
                "{t.text}"
              </p>
              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(212,175,55,0.1)', margin: '24px 0' }} />
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(212,175,55,0.06)',
                  flexShrink: 0,
                }}>
                  <span className="serif" style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 400 }}>{t.initials}</span>
                </div>
                <div>
                  <div className="sans" style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{t.name}</div>
                  <div className="sans" style={{ color: '#C4C4C4', fontSize: '11px', marginTop: '2px', letterSpacing: '0.05em' }}>
                    {t.role} · {t.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sp-grid-bottom">
          {testimonials.slice(3).map((t, i) => (
            <div key={t.name} className={`reveal reveal-delay-${i + 1} sp-card`}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                {[...Array(5)].map((_, si) => (
                  <span key={si} style={{ color: '#D4AF37', fontSize: '13px' }}>★</span>
                ))}
              </div>
              <p className="serif sp-quote">"{t.text}"</p>
              <div style={{ height: '1px', background: 'rgba(212,175,55,0.1)', margin: '24px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(212,175,55,0.06)', flexShrink: 0,
                }}>
                  <span className="serif" style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 400 }}>{t.initials}</span>
                </div>
                <div>
                  <div className="sans" style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{t.name}</div>
                  <div className="sans" style={{ color: '#C4C4C4', fontSize: '11px', marginTop: '2px', letterSpacing: '0.05em' }}>
                    {t.role} · {t.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hotel partners trust bar */}
        <div className="reveal" style={{ marginTop: '80px', paddingTop: '56px', borderTop: '1px solid rgba(212,175,55,0.08)', textAlign: 'center' }}>
          <div className="sans" style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#CFBB7A', fontWeight: 700, textTransform: 'uppercase', marginBottom: '36px' }}>
            {t('sp_recommended')}
          </div>
          <div className="sp-hotels">
            {hotelPartners.map((hotel, i) => (
              <React.Fragment key={hotel}>
                <div className="sans" style={{
                  color: '#B0B0B0',
                  fontSize: '13px',
                  letterSpacing: '0.12em',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  transition: 'color 0.3s ease',
                }}>
                  {hotel}
                </div>
                {i < hotelPartners.length - 1 && (
                  <div style={{ width: '1px', height: '20px', background: 'rgba(212,175,55,0.15)', flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .sp-grid-top {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(212,175,55,0.06);
          margin-bottom: 1px;
        }
        .sp-grid-bottom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(212,175,55,0.06);
          max-width: 67%;
          margin: 0 auto;
        }
        .sp-card {
          background: #0D0D0D;
          padding: 44px 40px;
          transition: background 0.35s ease;
        }
        .sp-card:hover { background: #121212; }
        .sp-quote {
          color: rgba(255,255,255,0.7);
          font-size: 16px;
          line-height: 1.75;
          font-style: italic;
          font-weight: 300;
          flex: 1;
        }
        .sp-hotels {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .sp-hotels > div:hover {
          color: #E8E8E8 !important;
        }
        @media (max-width: 900px) {
          .sp-grid-top { grid-template-columns: 1fr; }
          .sp-grid-bottom { grid-template-columns: 1fr; max-width: 100%; }
          .sp-card { padding: 36px 28px; }
        }
      `}</style>
    </section>
  );
};

export default SocialProof;
