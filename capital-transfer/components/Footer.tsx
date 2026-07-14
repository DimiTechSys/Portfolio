'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Logo from '@/components/Logo';

const Footer: React.FC = () => {
  const t = useTranslations();
  
  return (
    <footer style={{ background: '#111111', borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '48px 40px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Ligne 1 : Logo + liens + contact */}
        <div className="footer-grid" style={{ marginBottom: '40px' }}>

          {/* Colonne 1 : Logo + baseline */}
          <div>
            <Link href="/" className="block hover:opacity-90 transition-opacity">
              <Logo variant="dark" />
            </Link>
            <p className="sans" style={{ color: '#9A8070', fontSize: '12px', marginTop: '16px', lineHeight: 1.6 }}>
              {t('footer_tagline')}<br/>
              {t('footer_location')}
            </p>
          </div>

          {/* Colonne 2 : Navigation */}
          <div>
            <p className="sans" style={{ color: '#FFFFFF', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>
              {t('footer_nav_title')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/" className="sans hover-link" style={{ color: '#9A8070', fontSize: '13px', textDecoration: 'none' }}>{t('nav_home')}</Link>
              <Link href="/book" className="sans hover-link" style={{ color: '#9A8070', fontSize: '13px', textDecoration: 'none' }}>{t('nav_booking')}</Link>
              <Link href="/services/corporate" className="sans hover-link" style={{ color: '#9A8070', fontSize: '13px', textDecoration: 'none' }}>{t('nav_corporate')}</Link>
              <Link href="/services/tourism" className="sans hover-link" style={{ color: '#9A8070', fontSize: '13px', textDecoration: 'none' }}>{t('nav_tourism')}</Link>
              <Link href="/about" className="sans hover-link" style={{ color: '#9A8070', fontSize: '13px', textDecoration: 'none' }}>{t('nav_about')}</Link>
            </div>
          </div>

          {/* Colonne 3 : Contact */}
          <div>
            <p className="sans" style={{ color: '#FFFFFF', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>
              {t('footer_contact_title')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="sans" style={{ color: '#9A8070', fontSize: '13px' }}>+33 (0)1 23 45 67 89</p>
              <p className="sans" style={{ color: '#9A8070', fontSize: '13px' }}>contact@capitaletransfer.fr</p>
              <p className="sans" style={{ color: '#9A8070', fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
                {t('footer_availability')}<br/>
                {t('footer_response')}
              </p>
            </div>
          </div>
        </div>

        {/* Ligne 2 : Séparateur + mentions légales */}
        <div className="footer-bottom" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p className="sans" style={{ color: '#9CA3AF', fontSize: '11px' }}>
            © 2026 Capitale Transfer · {t('footer_rights')}
          </p>
          <div className="footer-links" style={{ display: 'flex', gap: '24px' }}>
            <Link href="/mentions-legales" className="sans hover-link" style={{ color: '#9CA3AF', fontSize: '11px', textDecoration: 'none' }}>{t('footer_legal')}</Link>
            <Link href="/confidentialite" className="sans hover-link" style={{ color: '#9CA3AF', fontSize: '11px', textDecoration: 'none' }}>{t('footer_privacy')}</Link>
            <Link href="/cgv" className="sans hover-link" style={{ color: '#9CA3AF', fontSize: '11px', textDecoration: 'none' }}>{t('footer_cgv')}</Link>
          </div>
        </div>

      </div>

      <style jsx>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 40px;
        }
        .hover-link {
          transition: color 0.3s ease;
        }
        .hover-link:hover {
          color: #FFFFFF !important;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
          .footer-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

