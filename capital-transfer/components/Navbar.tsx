'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { Globe, ChevronDown } from 'lucide-react';
import Logo from '@/components/Logo';

const Navbar: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'ru', label: 'Русский' },
  ];

  const changeLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsLangDropdownOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinks = [
    { href: '/services/chauffeur', label: t('nav_chauffeur') },
    { href: '/services/tourism', label: t('nav_tourism_luxe') },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ${isScrolled ? 'bg-[#111111]/96 backdrop-blur-md shadow-lg' : 'bg-[#111111]'}`}
      style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}
    >
      <div
        className="w-full flex items-center justify-between"
        style={{
          height: '72px',
          paddingLeft: 'clamp(1.25rem, 4.5vw, 3rem)',
          paddingRight: 'clamp(1.25rem, 4.5vw, 3rem)',
          boxSizing: 'border-box',
        }}
      >

        {/* Left: Logo — extra inset from the bar edge */}
        <div className="flex-shrink-0 pl-3 sm:pl-4 md:pl-5">
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <Logo variant="dark" />
          </Link>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="sans uppercase transition-all duration-200"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: '#D4AF37',
                  textDecoration: 'none',
                  position: 'relative',
                  paddingBottom: '4px',
                  marginRight: '32px',
                }}
              >
                {link.label}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#D4AF37',
                    opacity: 0.6,
                  }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Language + CTA */}
        <div
          className="flex items-center pr-2 sm:pr-3 md:pr-4"
          style={{ gap: 'clamp(1rem, 2.5vw, 1.75rem)' }}
        >

          {/* Language Selector */}
          <div className="relative shrink-0" ref={langRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center space-x-2 text-[13px] font-medium text-white hover:opacity-70 transition-all uppercase tracking-[0.06em] focus:outline-none"
            >
              <Globe size={16} className="text-[#9A8070]" />
              <span className="font-bold">{locale.toUpperCase()}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            <div className={`absolute right-0 mt-4 w-[160px] bg-[#111111] border border-white/10 rounded-[6px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-150 origin-top-right z-50 ${isLangDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-[6px] pointer-events-none'}`}>
              <div className="py-[6px]">
                {languages.map((lang) => {
                  const isActive = locale === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-[18px] py-[11px] text-[13px] transition-all duration-150 ${
                        isActive
                          ? 'text-white bg-white/5 border-l-2 border-[#D4AF37]'
                          : 'text-[#B0B0B0] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="font-medium">{lang.label}</span>
                      <span className="text-[10px] font-bold opacity-40">
                        {lang.code.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-4 w-px shrink-0 bg-white/10 mx-1 sm:mx-2" aria-hidden />

          {/* CTA Button */}
          <Link
            href="/book"
            className="sans uppercase hidden sm:inline-block transition-all shrink-0"
            style={{
              backgroundColor: '#420F1A',
              color: '#D4AF37',
              padding: '10px 24px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.2em',
              textDecoration: 'none',
              marginLeft: 'clamp(0.35rem, 1.2vw, 0.75rem)',
            }}
          >
            {t('nav_booking')}
          </Link>
        </div>
      </div>

      {/* Mobile nav links row */}
      <div
        className="md:hidden flex items-center justify-center border-t border-white/5 py-3"
        style={{
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)',
          gap: '1.5rem',
        }}
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="sans uppercase"
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#D4AF37',
                textDecoration: 'none',
                margin: '0 12px',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
