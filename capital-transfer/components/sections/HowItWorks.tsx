'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

const HowItWorks: React.FC = () => {
  const t = useTranslations();

  const steps = [
    { num: t('step_1_title'), title: t('step_1_name'), desc: t('step_1_desc') },
    { num: t('step_2_title'), title: t('step_2_name'), desc: t('step_2_desc') },
    { num: t('step_3_title'), title: t('step_3_name'), desc: t('step_3_desc') },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container">
        <h2 className="serif text-4xl md:text-5xl mb-20 text-center reveal">{t('how_it_works_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {steps.map((step, index) => (
            <div key={index} className={`space-y-6 reveal reveal-delay-${index + 1}`}>
              <div className="serif text-[40px] font-medium leading-none text-vignoble">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-gris-anthracite">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .text-vignoble {
          color: #420F1A;
        }
        .text-gris-anthracite {
          color: #1D1D1D;
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
