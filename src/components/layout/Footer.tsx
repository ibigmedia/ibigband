"use client";

import React from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink, Youtube, Heart } from 'lucide-react';
import BandMark from '@/components/layout/BandMark';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  return (
    <footer className="bg-[#121110] text-white/75 py-10 md:py-24 px-5 md:px-6 border-t border-black/10">
      <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-12">
        <div className="border-b border-white/10 md:border-0 pb-6 md:pb-0">
          <div className="flex items-center gap-3 text-white mb-4 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
              <BandMark className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <span className="text-2xl md:text-4xl font-wordmark tracking-tight mt-1">ibiGband</span>
          </div>
          <p className="text-[13px] md:text-base leading-relaxed font-normal mb-4 md:mb-0">{t('tagline')}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:contents">
          <div className="pt-2 md:pt-0 shrink-0">
            <h5 className="text-white text-[12px] md:text-sm font-bold mb-3 md:mb-8 uppercase tracking-tighter md:tracking-[0.2em] whitespace-nowrap">{t('navHeading')}</h5>
            <ul className="text-[12px] md:text-base space-y-2 md:space-y-5 font-normal tracking-tighter md:tracking-normal">
              <li><Link href="/about" className="hover:text-t-gold transition-colors whitespace-nowrap">{tNav('about')}</Link></li>
              <li><Link href="/archive" className="hover:text-t-gold transition-colors whitespace-nowrap">{t('musicAndSheets')}</Link></li>
              <li><Link href="/blog" className="hover:text-t-gold transition-colors whitespace-nowrap">{t('archiveBlog')}</Link></li>
              <li><Link href="/setlist" className="hover:text-t-gold transition-colors whitespace-nowrap">{t('setlistMaker')}</Link></li>
            </ul>
          </div>
          <div className="pt-2 md:pt-0 shrink-0">
            <h5 className="text-white text-[12px] md:text-sm font-bold mb-3 md:mb-8 uppercase tracking-tighter md:tracking-[0.2em] whitespace-nowrap">{t('supportHeading')}</h5>
            <ul className="text-[12px] md:text-base space-y-2 md:space-y-5 font-normal tracking-tighter md:tracking-normal">
              <li className="cursor-pointer hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"><ExternalLink size={10} className="md:w-4 md:h-4"/> {t('partnership')}</li>
              <li className="cursor-pointer hover:text-white transition-colors whitespace-nowrap">{t('privacy')}</li>
              <li className="cursor-pointer hover:text-white transition-colors whitespace-nowrap">{t('support')}</li>
            </ul>
          </div>
          <div className="pt-2 md:pt-0 shrink-0">
            <h5 className="text-white text-[12px] md:text-sm font-bold mb-3 md:mb-8 uppercase tracking-tighter md:tracking-[0.2em] whitespace-nowrap">{t('globalHeading')}</h5>
            <div className="flex gap-2 flex-wrap">
              <a href="#" className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E8481C] hover:text-[#121110] transition-all"><Youtube size={16} className="md:w-6 md:h-6" /></a>
              <a href="#" className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E8481C] hover:text-[#121110] transition-all"><Heart size={16} className="md:w-6 md:h-6" /></a>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 md:mt-20 pt-6 md:pt-10 border-t border-white/5 flex flex-col-reverse md:flex-row justify-between gap-4 md:gap-6 text-[12px] md:text-xs uppercase tracking-widest font-bold text-center md:text-left">
        <span className="opacity-70">&copy; {new Date().getFullYear()} ibiGband. {t('builtWith')}</span>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 items-center justify-center md:justify-end">
          <span className="text-t-gold">{t('pwa')}</span>
          <span>{t('hq')}</span>
        </div>
      </div>
    </footer>
  );
}
