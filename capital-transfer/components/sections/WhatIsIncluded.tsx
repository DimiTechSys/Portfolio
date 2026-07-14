'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

const WhatIsIncluded: React.FC = () => {
  const t = useTranslations();

  const inclusions = [
    { num: '01', label: t('included_sign') },
    { num: '02', label: t('included_flight') },
    { num: '03', label: t('included_water') },
    { num: '04', label: t('included_usb') },
    { num: '05', label: t('included_fixed') },
    { num: '06', label: t('included_waiting') },
  ];

  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background image with overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('/experience.webp'), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(29,29,29,0.70)' }}></div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <h2 className="serif text-center mb-16" style={{ color: '#FFFFFF', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          {t('included_title')}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
        }}>
          {inclusions.map((item) => (
            <div key={item.num} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              borderBottom: '0.5px solid rgba(255,255,255,0.08)',
              paddingBottom: '24px',
            }}>
              {/* Decorative number — large, treated as design element */}
              <span className="serif" style={{
                fontSize: '48px',
                fontWeight: '300',
                lineHeight: 1,
                color: '#707070',
                minWidth: '52px',
                userSelect: 'none',
              }}>
                {item.num}
              </span>
              <span style={{
                color: '#E0E0E0',
                fontSize: '15px',
                fontWeight: '400',
                lineHeight: 1.6,
                paddingTop: '12px',
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatIsIncluded;
