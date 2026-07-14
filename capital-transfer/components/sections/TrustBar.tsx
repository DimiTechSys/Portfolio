'use client';

import React from 'react';
import { ShieldCheck, UserCheck, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

const TrustBar: React.FC = () => {
  const t = useTranslations();

  const items = [
    {
      icon: <ShieldCheck size={24} color="#420F1A" strokeWidth={1.5} />,
      label: t('trust_fixed_rate'),
    },
    {
      icon: <UserCheck size={24} color="#420F1A" strokeWidth={1.5} />,
      label: t('trust_drivers'),
    },
    {
      icon: <Clock size={24} color="#420F1A" strokeWidth={1.5} />,
      label: t('trust_availability'),
    },
  ];

  return (
    <section style={{ backgroundColor: '#FFFEF4', padding: '40px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
        }} className="trust-grid">
          {items.map((item, index) => (
            <div 
              key={index} 
              style={{
                padding: '24px 32px',
                borderRight: index < items.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
              className="trust-item"
            >
              <div style={{ marginBottom: '8px' }}>
                {item.icon}
              </div>
              <div className="serif" style={{ color: '#1D1D1D', fontSize: '15px', fontWeight: 500, marginTop: '8px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .trust-grid {
            grid-template-columns: 1fr !important;
          }
          .trust-item {
            border-right: none !important;
            border-bottom: 0.5px solid rgba(0,0,0,0.08);
          }
          .trust-item:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustBar;
