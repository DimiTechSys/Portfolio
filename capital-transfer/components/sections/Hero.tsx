'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

const Hero: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section 
      className="relative flex items-center overflow-hidden min-h-[100vh]"
      style={{
        backgroundColor: '#1D1D1D',
        backgroundImage: "linear-gradient(135deg, rgba(29,29,29,0.85) 0%, rgba(29,29,29,0.55) 60%, rgba(29,29,29,0.30) 100%), url('/hero.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
      }}
    >
      <div 
        className="absolute inset-0 z-10" 
        style={{
          background: 'linear-gradient(135deg, rgba(29,29,29,0.85) 0%, rgba(29,29,29,0.55) 60%, rgba(29,29,29,0.30) 100%)'
        }}
      ></div>

      <div className="relative z-20 w-full" style={{ paddingLeft: '8vw', paddingTop: '10vh' }}>
        <div className="max-w-2xl">
          {/* Label */}
          <div 
            className="sans uppercase animate-fade-in" 
            style={{ fontSize: '12px', letterSpacing: '0.35em', color: '#9A8070', fontWeight: 600, marginBottom: '32px' }}
          >
            Paris · Île-de-France
          </div>

          {/* Headline */}
          <h1 
            className="serif text-white animate-fade-in"
            style={{ fontSize: 'clamp(48px, 6vw, 82px)', fontWeight: 300, lineHeight: 1.15, marginBottom: '36px' }}
          >
            {t('hero_title')}
          </h1>

          {/* Sub-headline */}
          <p 
            className="sans text-[#B0B0B0] animate-fade-in-delayed"
            style={{ fontSize: '18px', maxWidth: '520px', lineHeight: 1.85, marginBottom: '52px' }}
          >
            {t('hero_subtitle')}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delayed-more">
            <Link 
              href="/book" 
              className="sans uppercase hover:brightness-125 transition-all text-center"
              style={{
                backgroundColor: '#420F1A',
                color: '#F5F5F5',
                padding: '20px 40px',
                letterSpacing: '0.2em',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '0',
                display: 'inline-block'
              }}
            >
              {t('cta_book')}
            </Link>

          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fade-in-delayed {
          animation: fadeIn 1s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-fade-in-delayed-more {
          animation: fadeIn 1s ease-out 0.4s forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
