'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { Users, Briefcase } from 'lucide-react';
import { useTranslations } from 'next-intl';

const Fleet: React.FC = () => {
  const t = useTranslations();

  const vehicles = [
    {
      id: 'sedan',
      image: '/class-e.webp',
      name: 'Mercedes-Benz Classe E',
      subtitle: t('fleet_sedan_subtitle'),
      pax: 3,
      luggage: 3,
      price: 35,
    },
    {
      id: 'business',
      image: '/class-s.webp',
      name: 'Mercedes-Benz Classe S',
      subtitle: t('fleet_business_subtitle'),
      pax: 3,
      luggage: 3,
      price: 75,
    },
    {
      id: 'van',
      image: '/class-v.webp',
      name: 'Mercedes-Benz Classe V',
      subtitle: t('fleet_van_subtitle'),
      pax: 7,
      luggage: 6,
      price: 110,
    },
    {
      id: 'luxury',
      image: '/maybach.webp',
      name: 'Mercedes-Maybach Classe S',
      subtitle: t('fleet_luxury_subtitle'),
      pax: 3,
      luggage: 3,
      price: 140,
    },
    {
      id: 'suv',
      image: '/range-rover.webp',
      name: 'Range Rover Vogue',
      subtitle: t('fleet_suv_subtitle'),
      pax: 4,
      luggage: 4,
      price: 120,
    },
    {
      id: 'moto',
      image: '/moto.webp',
      name: 'Honda Goldwing',
      subtitle: t('fleet_moto_subtitle'),
      pax: 1,
      luggage: 1,
      price: 25,
    },
  ];

  return (
    <section id="fleet" style={{ backgroundColor: '#1D1D1D', padding: '120px 0' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 className="serif text-white mb-4" style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}>
            {t('fleet_title')}
          </h2>
          <p className="sans" style={{ color: '#B0B0B0', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {t('fleet_subtitle')}
          </p>
        </div>

        <div className="fleet-grid">
          {vehicles.map((v) => (
            <div key={v.id} className="fleet-card">
              <div className="fleet-image-wrapper">
                <img 
                  src={v.image} 
                  alt={v.name} 
                  className="fleet-image"
                />
              </div>
              
              <div className="fleet-content">
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="serif" style={{ fontSize: '24px', color: '#FFFFFF', marginBottom: '6px' }}>
                    {v.name}
                  </h3>
                  <div className="sans uppercase" style={{ fontSize: '11px', color: '#9A8070', letterSpacing: '0.15em' }}>
                    {v.subtitle}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', color: '#B0B0B0', fontSize: '13px' }} className="sans">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} />
                    <span>{t('pax_count', { count: v.pax })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={14} />
                    <span>{t('luggage_count', { count: v.luggage })}</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

                <p className="sans" style={{ color: '#888888', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px', flexGrow: 1 }}>
                  {t('faq_vehicles_a').split('.')[v.id === 'sedan' ? 0 : v.id === 'business' ? 1 : v.id === 'van' ? 2 : 3] || ''}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="sans" style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: 600 }}>
                    {t('from_price', { price: v.price })}
                  </div>
                  <Link 
                    href="/book" 
                    className="btn-book-fleet"
                    style={{
                      color: '#D4AF37',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    {t('book_now')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .fleet-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .fleet-card {
          background-color: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          transition: all 0.35s ease;
          height: 100%;
          overflow: hidden;
        }
        .fleet-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          transform: translateY(-6px);
        }
        .fleet-image-wrapper {
          height: 230px;
          background-color: rgba(0,0,0,0.3);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fleet-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.55s ease;
        }
        .fleet-card:hover .fleet-image {
          transform: scale(1.07);
        }
        .fleet-content {
          padding: 28px 28px 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .btn-book-fleet {
          background-color: transparent;
          color: #D4AF37 !important;
          text-transform: uppercase;
          padding: 0;
          font-size: 11px;
          letter-spacing: 0.2em;
          font-weight: 800;
          transition: all 0.25s ease;
          display: inline-block;
          text-align: right;
          text-decoration: none;
          position: relative;
        }
        .btn-book-fleet::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background-color: #D4AF37;
          transition: width 0.3s ease;
        }
        .btn-book-fleet:hover::after {
          width: 100%;
        }
        .btn-book-fleet:hover {
          opacity: 0.8;
        }
        @media (max-width: 1024px) {
          .fleet-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .fleet-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default Fleet;
