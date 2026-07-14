'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

const FAQ: React.FC = () => {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqKeys = [
    { q: 'faq_flight_q', a: 'faq_flight_a' },
    { q: 'faq_someone_q', a: 'faq_someone_a' },
    { q: 'faq_delay_q', a: 'faq_delay_a' },
    { q: 'faq_cancel_q', a: 'faq_cancel_a' },
    { q: 'faq_vehicles_q', a: 'faq_vehicles_a' },
  ];

  const toggle = (i: number) => {
    setOpenIndex(prev => (prev === i ? null : i));
  };

  return (
    <section style={{ backgroundColor: '#FFFFFF', padding: '80px 0' }}>
      <div className="container" style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
        <h2
          className="serif"
          style={{
            color: '#1D1D1D',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            textAlign: 'center',
            marginBottom: '56px',
          }}
        >
          {t('faq_title')}
        </h2>

        <div>
          {faqKeys.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}
              >
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: '16px',
                  }}
                >
                  <span
                    className="serif"
                    style={{
                      color: '#1D1D1D',
                      fontSize: '17px',
                      fontWeight: '400',
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {t(item.q)}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transition: 'transform 300ms ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: '#420F1A',
                    }}
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 300ms ease',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p
                      style={{
                        color: '#4B5563',
                        fontSize: '14px',
                        lineHeight: 1.75,
                        paddingBottom: '24px',
                        margin: 0,
                      }}
                    >
                      {t(item.a)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
