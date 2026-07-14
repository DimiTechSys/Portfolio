'use client';

import React from 'react';
import { usePathname } from '@/i18n/routing';
import Footer from './Footer';

const FooterWrapper: React.FC = () => {
  const pathname = usePathname();
  
  if (pathname === '/book') {
    return null;
  }

  return <Footer />;
};

export default FooterWrapper;
