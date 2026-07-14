'use client';

import React, { use } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getTourismExperiences } from '@/lib/tourismData';
import { Star, MapPin, Clock, Shield, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function ExperienceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations();
  const locale = useLocale();
  
  const experiences = getTourismExperiences(locale);
  const experience = experiences[id];

  if (!experience) {
    return (
      <main className="dark-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px' }}>
        <h1 className="serif" style={{ color: '#FFFFFF', marginBottom: '24px' }}>Expérience non trouvée</h1>
        <Link href="/services/tourism" className="btn-ghost">Retour au tourisme</Link>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: '#111111', color: '#FFFFFF', minHeight: '100vh' }}>
      
      {/* ─── HERO SECTION ─── */}
      <section style={{ position: 'relative', height: '80vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${experience.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.05)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(17,17,17,0.4) 0%, rgba(17,17,17,0.95) 100%)',
        }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '80px' }}>
          <Link href="/services/tourism" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '40px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Retour aux expériences
          </Link>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#D4AF37', color: '#111', padding: '6px 16px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>
            <Star size={12} /> {experience.badge}
          </div>
          
          <h1 className="serif" style={{ fontSize: 'clamp(48px, 8vw, 84px)', lineHeight: 1.05, marginBottom: '24px', maxWidth: '900px' }}>
            {experience.title}
          </h1>
          
          <p className="sans" style={{ fontSize: '20px', color: '#D4AF37', fontStyle: 'italic', maxWidth: '600px', marginBottom: '40px', fontWeight: 300 }}>
            {experience.subtitle}
          </p>
        </div>
      </section>

      {/* ─── CONTENT SECTION ─── */}
      <section style={{ padding: '100px 0', position: 'relative' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '80px' }}>
          
          {/* Left Column: Details */}
          <div>
            <div style={{ width: '60px', height: '2px', backgroundColor: '#D4AF37', marginBottom: '40px' }} />
            <p className="sans" style={{ fontSize: '18px', lineHeight: 1.8, color: '#CCCCCC', marginBottom: '60px' }}>
              {experience.description}
            </p>
            
            {experience.sections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '60px' }}>
                {section.image && (
                  <div style={{ marginBottom: '32px', width: '100%', height: '400px', overflow: 'hidden', borderRadius: '4px' }}>
                    <img src={section.image} alt={section.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <h2 className="serif" style={{ fontSize: '32px', marginBottom: '24px', color: '#FFFFFF' }}>{section.title}</h2>
                <p className="sans" style={{ fontSize: '16px', lineHeight: 1.7, color: '#AAAAAA', marginBottom: section.list ? '24px' : '0' }}>
                  {section.content}
                </p>
                {section.list && (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {section.list.map((item, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#FFFFFF', fontSize: '15px' }}>
                        <div style={{ width: '6px', height: '6px', backgroundColor: '#D4AF37', transform: 'rotate(45deg)' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div style={{ width: '60px', height: '2px', backgroundColor: '#D4AF37', marginBottom: '40px', marginTop: '20px' }} />

            {/* Pricing Options */}
            {experience.pricingOptions && experience.pricingOptions.length > 0 && (
              <div style={{ marginBottom: '60px' }}>
                <h3 className="serif" style={{ fontSize: '28px', color: '#D4AF37', marginBottom: '30px' }}>Options Tarifaires</h3>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                  {experience.pricingOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: i === experience.pricingOptions!.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ color: '#FFF', fontSize: '16px' }}>{opt.name}</div>
                      <div style={{ color: '#D4AF37', fontWeight: 600 }}>{opt.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Packages */}
            {experience.pricingPackages && experience.pricingPackages.length > 0 && (
              <div style={{ marginBottom: '60px' }}>
                <h3 className="serif" style={{ fontSize: '28px', color: '#D4AF37', marginBottom: '30px' }}>Forfaits Sur-Mesure</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {experience.pricingPackages.map((pkg, i) => (
                    <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '30px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                        <h4 className="serif" style={{ fontSize: '22px', color: '#FFF', margin: 0 }}>{pkg.name}</h4>
                        <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: '8px 16px', color: '#D4AF37', fontWeight: 600, border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px' }}>{pkg.price}</div>
                      </div>
                      <p className="sans" style={{ color: '#AAAAAA', fontSize: '15px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{pkg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ backgroundColor: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', padding: '40px', marginTop: '80px' }}>
              <h3 className="serif" style={{ color: '#D4AF37', marginBottom: '24px' }}>Inclus dans votre expérience</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {experience.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FFFFFF', fontSize: '14px' }}>
                    <Check size={16} color="#D4AF37" /> {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column: Sticky Sidebar */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'sticky', top: '120px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '40px', backdropFilter: 'blur(10px)' }}>
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <span className="sans" style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Tarif Prestige</span>
                <div className="serif" style={{ fontSize: '48px', color: '#D4AF37', marginTop: '8px' }}>
                  {typeof experience.price === 'number' && experience.price > 0 ? `${experience.price}€` : experience.price === 0 || experience.price === '0' ? 'Sur-mesure' : experience.price}
                </div>
                {typeof experience.price === 'number' && experience.price > 0 && <span className="sans" style={{ color: '#555', fontSize: '13px' }}>par groupe / trajet</span>}
              </div>
              
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  <Clock size={20} color="#D4AF37" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Durée flexible</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>À votre convenance</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  <Shield size={20} color="#D4AF37" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Service de Conciergerie</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Disponible 24h/24, 7j/7</div>
                  </div>
                </div>
              </div>
              
              <Link href="/contact" className="btn-primary" style={{ width: '100%', padding: '20px', backgroundColor: '#D4AF37', color: '#111', fontWeight: 800, fontSize: '12px', letterSpacing: '0.2em' }}>
                RÉSERVER CETTE EXPÉRIENCE
              </Link>
              
              <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
                Besoin d'un itinéraire spécifique ? Contactez notre concierge pour une demande personnalisée.
              </p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ─── NEXT EXPERIENCES ─── */}
      <section style={{ padding: '120px 0', backgroundColor: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="serif">Autres Expériences d'Exception</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {Object.values(experiences).slice(0, 3).filter(exp => exp.id !== id).map(exp => (
              <Link key={exp.id} href={`/services/tourism/${exp.id}`} style={{ position: 'relative', height: '300px', display: 'block', overflow: 'hidden' }}>
                 <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${exp.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.6s ease',
                }} className="next-exp-img" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.9) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
                   <div style={{ fontSize: '10px', color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>{exp.badge}</div>
                   <h3 className="serif" style={{ color: '#FFF', fontSize: '20px' }}>{exp.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .btn-primary:hover {
          background-color: #FFFFFF !important;
          color: #111 !important;
        }
        .next-exp-img:hover {
          transform: scale(1.1);
        }
        @media (max-width: 1024px) {
          .container {
            grid-template-columns: 1fr;
            gap: 60px;
          }
        }
      `}</style>
    </main>
  );
}
