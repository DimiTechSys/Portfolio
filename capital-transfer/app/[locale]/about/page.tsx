'use client';

import React from 'react';
import FinalCTA from '@/components/sections/FinalCTA';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations();

  return (
    <main>
      <section className="bg-gris-anthracite text-white pt-48 pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="serif text-5xl md:text-7xl mb-8">{t('about_hero_title')}</h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              {t('about_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1549463384-84504d44a59e?q=80&w=2000&auto=format&fit=crop" alt="Brand Story" className="w-full h-[600px] object-cover grayscale" />
            <div className="space-y-12">
              <div>
                <h2 className="serif text-4xl mb-6">{t('about_human_title')}</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {t('about_human_desc')}
                </p>
              </div>
              <div>
                <h2 className="serif text-4xl mb-6">{t('about_quality_title')}</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {t('about_quality_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-blanc-casse">
        <div className="container text-center max-w-3xl">
           <h2 className="serif text-4xl md:text-5xl mb-8">{t('about_paris_title')}</h2>
           <p className="text-xl text-gray-600 leading-relaxed">
             {t('about_paris_desc')}
           </p>
        </div>
      </section>
      
      <FinalCTA />
    </main>
  );
}
