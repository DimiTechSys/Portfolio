'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Phone, MessageSquare, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations();

  return (
    <main>
      <section className="bg-gris-anthracite text-white pt-48 pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="serif text-5xl md:text-7xl mb-8">{t('contact_hero_title')}</h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              {t('contact_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1 space-y-12">
              <div className="flex items-start space-x-6">
                <div className="bg-blanc-casse p-4 text-vignoble rounded-sm">
                   <Phone size={24} />
                </div>
                <div>
                  <h3 className="serif text-xl mb-2">{t('contact_call_title')}</h3>
                  <p className="text-gray-500 mb-1">+33 (0) 1 23 45 67 89</p>
                  <p className="text-gray-400 text-sm">{t('contact_call_intl')}: +33 1 23 45 67 89</p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-blanc-casse p-4 text-vignoble rounded-sm">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="serif text-xl mb-2">{t('contact_whatsapp_title')}</h3>
                  <p className="text-gray-500 mb-1">+33 (0) 6 12 34 56 78</p>
                  <p className="text-gray-400 text-sm">{t('contact_whatsapp_desc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-blanc-casse p-4 text-vignoble rounded-sm">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="serif text-xl mb-2">{t('contact_hours_title')}</h3>
                  <p className="text-gray-500 mb-1">{t('contact_hours_desc')}</p>
                  <p className="text-gray-400 text-sm">{t('contact_hours_days')}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-blanc-casse p-10 md:p-16 rounded-sm">
              <h2 className="serif text-3xl mb-10">{t('contact_form_title')}</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">{t('contact_form_name')}</label>
                  <input type="text" className="w-full p-4 border border-gray-200 outline-none focus:border-vignoble transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">{t('contact_form_email')}</label>
                  <input type="email" className="w-full p-4 border border-gray-200 outline-none focus:border-vignoble transition-colors" />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">{t('contact_form_subject')}</label>
                  <input type="text" className="w-full p-4 border border-gray-200 outline-none focus:border-vignoble transition-colors" />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">{t('contact_form_message')}</label>
                  <textarea className="w-full p-4 border border-gray-200 outline-none focus:border-vignoble transition-colors h-40"></textarea>
                </div>
                <div className="col-span-full">
                  <button type="submit" className="btn-primary px-12 py-4">{t('contact_form_send')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      <style jsx>{`
        .bg-blanc-casse { background-color: #FFFEF4; }
        .text-vignoble { color: #420F1A; }
      `}</style>
    </main>
  );
}
