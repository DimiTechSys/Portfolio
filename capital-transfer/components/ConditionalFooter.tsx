'use client';
import { usePathname } from '@/i18n/routing';
import Footer from '@/components/Footer';

const ConditionalFooter: React.FC = () => {
  const pathname = usePathname();
  // Hide footer on booking page
  if (pathname?.startsWith('/book')) {
    return null;
  }
  return <Footer />;
};

export default ConditionalFooter;
