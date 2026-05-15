"use client";

import React from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { SheetMusic } from '@/lib/firebase/firestore';
import { Download, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface SheetDownloadModalProps {
  sheet: SheetMusic | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentModal: () => void;
}

export function SheetDownloadModal({ sheet, isOpen, onClose, onOpenPaymentModal }: SheetDownloadModalProps) {
  const { user, userData } = useAuth();
  const t = useTranslations('sheetDownload');

  if (!isOpen || !sheet) return null;

  const handleDownload = () => {
    // 실제 환경에서는 Storage 다운로드 URL로 리다이렉트하거나 Blob 스트리밍 처리
    window.open(sheet.pdfUrl, '_blank');
  };

  const isPremiumRequired = sheet.isPremiumOnly && !userData?.isPremium;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-ibig p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#78716A] hover:text-[#2D2926]">
          <X size={24} />
        </button>
        
        <h3 className="text-2xl font-handwriting mb-2">{sheet.title}</h3>
        <p className="text-sm text-[#78716A] mb-8 font-light italic">Key: {sheet.key} | BPM: {sheet.bpm}</p>

        {isPremiumRequired ? (
          <div className="bg-[#E6C79C]/10 border border-[#E6C79C] p-6 rounded-2xl mb-6 text-center">
            <AlertCircle className="mx-auto text-[#E6C79C] mb-3" size={32} />
            <p className="text-sm text-[#2D2926] font-bold mb-2">{t('premiumTitle')}</p>
            <p className="text-xs text-[#78716A] font-light mb-6 leading-relaxed">
              {t.rich('premiumBody', { br: () => <br /> })}
            </p>
            <Button variant="secondary" className="w-full" onClick={() => {
              onClose();
              onOpenPaymentModal();
            }}>
              {t('viewMembership')}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Button variant="primary" className="w-full" onClick={handleDownload}>
              <Download size={18} className="mr-2"/> {t('downloadPdf')}
            </Button>
          </div>
        )}

        {!user && (
          <p className="text-[10px] text-center text-[#78716A] mt-4">
            {t('loginNote')}
          </p>
        )}
      </div>
    </div>
  );
}
