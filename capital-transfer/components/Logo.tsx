import React from 'react';

type LogoVariant = 'dark' | 'light' | 'burgundy';

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', className = '' }) => {
  // dark variant (for dark background)
  let textColorMain = '#FFFFFF';
  let textColorSub = '#9A8070';
  let strokeColorMain = '#420F1A';
  let strokeColorSub = '#420F1A';
  let strokeOpacitySub = '0.4';

  if (variant === 'light') {
    // for light background
    textColorMain = '#1D1D1D';
    textColorSub = '#888888';
    strokeColorMain = '#420F1A';
    strokeColorSub = '#420F1A';
    strokeOpacitySub = '0.4';
  } else if (variant === 'burgundy') {
    // for burgundy background
    textColorMain = '#FFFFFF';
    textColorSub = '#FFFFFF';
    strokeColorMain = 'rgba(255,255,255,0.5)';
    strokeColorSub = 'rgba(255,255,255,0.5)';
    strokeOpacitySub = '0.4';
  }

  return (
    <div className={className} dir="ltr" style={{ display: 'inline-block', unicodeBidi: 'isolate' }}>
      <svg width="190" height="44" viewBox="0 0 190 44" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        {/* Carré extérieur */}
        <rect x="0" y="1" width="42" height="42" fill="none" stroke={strokeColorMain} strokeWidth="1.2"/>
        {/* Carré intérieur discret */}
        <rect x="3" y="4" width="36" height="36" fill="none" stroke={strokeColorSub} strokeWidth="0.3" opacity={strokeOpacitySub}/>
        {/* Monogramme CT */}
        <text x="21" y="29" fontFamily="Cormorant Garamond, Georgia, serif"
              fontSize="19" fontWeight="400" fill={textColorMain} textAnchor="middle">CT</text>
        {/* CAPITAL */}
        <text x="54" y="20" fontFamily="Cormorant Garamond, Georgia, serif"
              fontSize="17" fontWeight="300" letterSpacing="6" fill={textColorMain}>CAPITALE</text>
        {/* TRANSFER */}
        <text x="55" y="36" fontFamily="Cormorant Garamond, Georgia, serif"
              fontSize="9" fontWeight="300" letterSpacing="5" fill={textColorSub}>TRANSFER</text>
      </svg>
    </div>
  );
};

export default Logo;
