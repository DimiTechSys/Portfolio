'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Plane, Clock, Map, Star } from 'lucide-react';

const ServiceTypes: React.FC = () => {
  const t = useTranslations();
  const router = useRouter();

  const serviceTypes = [
    {
      id: 'transfert',
      icon: <Plane size={28} strokeWidth={1.3} />,
      title: t('st_transfer_title'),
      subtitle: t('st_transfer_subtitle'),
      desc: t('st_transfer_desc'),
      tags: [t('st_tag_airports'), t('st_tag_trains'), t('st_tag_hotels'), t('st_tag_parks')],
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=85&auto=format&fit=crop',
    },
    {
      id: 'disposition',
      icon: <Clock size={28} strokeWidth={1.3} />,
      title: t('st_disposition_title'),
      subtitle: t('st_disposition_subtitle'),
      desc: t('st_disposition_desc'),
      tags: [t('st_tag_half'), t('st_tag_full'), t('st_tag_multi'), t('st_tag_corporate')],
      image: '/images/tourism/black-luxury-sedan.jpeg',
    },
    {
      id: 'evenements',
      icon: <Star size={28} strokeWidth={1.3} />,
      title: t('st_events_title'),
      subtitle: t('st_events_subtitle'),
      desc: t('st_events_desc'),
      tags: [t('st_tag_weddings'), t('st_tag_galas'), t('st_tag_soirees'), t('st_tag_private')],
      image: '/images/tourism/romantic-ceremony.jpg',
    },
    {
      id: 'excursions',
      icon: <Map size={28} strokeWidth={1.3} />,
      title: t('st_excursions_title'),
      subtitle: t('st_excursions_subtitle'),
      desc: t('st_excursions_desc'),
      tags: [t('st_tag_versailles'), t('st_tag_normandy'), t('st_tag_vineyards'), t('st_tag_long')],
      image: '/images/tourism/versailles.png',
    },
  ];

  return (
    <section style={{ backgroundColor: '#111111', padding: '120px 0', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(24px, 5vw, 64px)' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="sans uppercase" style={{ fontSize: '9px', letterSpacing: '0.5em', color: 'rgba(212,175,55,0.55)', fontWeight: 700, marginBottom: '20px' }}>
            {t('st_main_tag')}
          </div>
          <h2 className="serif" style={{ color: '#FFFFFF', fontSize: 'clamp(30px, 3.5vw, 48px)', fontWeight: 300, lineHeight: 1.2, marginBottom: '0' }}>
            {t('st_main_title')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <div style={{ height: '1px', width: '40px', background: 'rgba(212,175,55,0.3)' }} />
            <div style={{ width: '3px', height: '3px', backgroundColor: 'rgba(212,175,55,0.5)', transform: 'rotate(45deg)' }} />
            <div style={{ height: '1px', width: '40px', background: 'rgba(212,175,55,0.3)' }} />
          </div>
        </div>

        {/* Grid */}
        <div className="stype-grid">
          {serviceTypes.map((s, idx) => (
            <div key={s.id} className={`stype-card reveal reveal-delay-${idx + 1}`}>
              {/* Image */}
              <div className="stype-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.title} className="stype-img" />
                <div className="stype-img-overlay" />
              </div>

              {/* Content */}
              <div className="stype-content">
                <div style={{ color: '#D4AF37', marginBottom: '20px', opacity: 0.8 }}>{s.icon}</div>
                <div style={{ height: '1px', width: '20px', background: 'rgba(212,175,55,0.35)', marginBottom: '20px' }} />
                <h3 className="serif" style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 300, marginBottom: '6px' }}>
                  {s.title}
                </h3>
                <div className="sans uppercase" style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#E8C547', fontWeight: 700, marginBottom: '18px' }}>
                  {s.subtitle}
                </div>
                <p className="sans" style={{ color: '#C8C8C8', fontSize: '14px', lineHeight: 1.85, marginBottom: '24px', flexGrow: 1 }}>
                  {s.desc}
                </p>
                {/* Tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {s.tags.map((tag) => (
                    <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '4px', height: '4px', backgroundColor: 'rgba(212,175,55,0.45)', flexShrink: 0, transform: 'rotate(45deg)' }} />
                      <span className="sans" style={{ color: '#B8B8B8', fontSize: '12px', letterSpacing: '0.05em' }}>{tag}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="sans stype-book-btn"
                  onClick={() => router.push('/book')}
                >
                  {t('st_book_now')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stype-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(212,175,55,0.07);
        }
        .stype-card {
          background: #111111;
          display: flex;
          flex-direction: column;
          transition: background 0.3s ease;
          overflow: hidden;
        }
        .stype-card:hover { background: #141414; }
        .stype-img-wrap {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .stype-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease, filter 0.4s ease;
          filter: grayscale(0.5) brightness(0.5);
        }
        .stype-card:hover .stype-img {
          transform: scale(1.06);
          filter: grayscale(0.1) brightness(0.6);
        }
        .stype-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #111111 0%, transparent 70%);
        }
        .stype-content {
          padding: 32px clamp(20px, 3vw, 36px) 40px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          border-top: 2px solid transparent;
          transition: border-top-color 0.3s ease;
        }
        .stype-card:hover .stype-content {
          border-top-color: rgba(212,175,55,0.3);
        }
        button.stype-book-btn {
          margin-top: auto;
          align-self: flex-start;
          display: inline-block;
          padding: 12px 20px;
          border-radius: 0;
          border: 1px solid rgba(183, 154, 102, 0.45);
          background-color: #3a1219;
          color: #f4f1ea;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        button.stype-book-btn:hover {
          background-color: #4a1a24;
          border-color: rgba(205, 180, 130, 0.55);
          color: #faf8f5;
        }
        button.stype-book-btn:focus-visible {
          outline: 2px solid rgba(201, 168, 113, 0.65);
          outline-offset: 2px;
        }
        @media (max-width: 1100px) {
          .stype-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .stype-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
};

export default ServiceTypes;
