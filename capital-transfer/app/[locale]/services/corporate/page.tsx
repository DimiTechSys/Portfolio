'use client';

import React from 'react';
import FinalCTA from '@/components/sections/FinalCTA';
import { useTranslations } from 'next-intl';
import { Building2, CreditCard, Shield, Map } from 'lucide-react';

export default function CorporatePage() {
  const t = useTranslations();

  const features = [
    { icon: <Building2 size={32} />, title: t('corporate_feature_1_title'), desc: t('corporate_feature_1_desc') },
    { icon: <CreditCard size={32} />, title: t('corporate_feature_2_title'), desc: t('corporate_feature_2_desc') },
    { icon: <Shield size={32} />, title: t('corporate_feature_3_title'), desc: t('corporate_feature_3_desc') },
    { icon: <Map size={32} />, title: t('corporate_feature_4_title'), desc: t('corporate_feature_4_desc') },
  ];

  return (
    <main>
      <section className="relative text-white pt-48 pb-32 overflow-hidden" style={{ backgroundColor: '#1D1D1D' }}>
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85')" }}
        >
          <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(29,29,29,0.65)' }}></div>
        </div>

        <div className="container relative z-20">
          <div className="max-w-3xl">
            <h1 className="serif text-5xl md:text-7xl mb-8">{t('corporate_hero_title')}</h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              {t('corporate_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((f, i) => (
              <div key={i} className="space-y-6">
                <div className="text-vignoble">{f.icon}</div>
                <h3 className="serif text-2xl">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-blanc-casse">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2000&auto=format&fit=crop" alt="Corporate Service" className="w-full h-[600px] object-cover grayscale" />
            <div>
              <h2 className="serif text-4xl md:text-5xl mb-8">{t('corporate_discretion_title')}</h2>
              <div className="space-y-8 text-gray-600 text-lg">
                <p>{t('corporate_discretion_p1')}</p>
                <p>{t('corporate_discretion_p2')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <FinalCTA />
      <style jsx>{`
        .text-vignoble { color: #420F1A; }
      `}</style>
    </main>
  );
}
