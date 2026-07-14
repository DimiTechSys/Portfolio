'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

const FinalCTA: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section style={{ backgroundColor: '#1D1D1D', padding: '100px 0' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
        <h2 className="serif" style={{ color: '#FFFFFF', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '16px', lineHeight: 1.3 }}>
          {t('final_cta_title')}
        </h2>
        <p style={{ color: '#B0B0B0', fontSize: '16px', marginBottom: '40px', lineHeight: 1.7 }}>
          {t('hero_subtitle')}
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <Link href="/book" style={{
            backgroundColor: '#420F1A',
            color: '#F5F5F5',
            padding: '20px 48px',
            fontWeight: '800',
            fontSize: '13px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-block',
            borderRadius: '0',
          }}>
            {t('cta_book')}
          </Link>

        </div>

        <p style={{ color: '#8E8E8E', fontSize: '13px', letterSpacing: '0.05em' }}>
          +33 (0)1 XX XX XX XX
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
