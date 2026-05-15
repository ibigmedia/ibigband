"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { X, CheckCircle } from 'lucide-react';
import PayPalButton from '@/components/PayPalButton'; // 새로 만든 페이팔 버튼 임포트
import { useTranslations } from 'next-intl';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user, userData } = useAuth();
  const t = useTranslations('payment');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-ibig p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#78716A] hover:text-[#2D2926]">
          <X size={24} />
        </button>

        {!isSuccess ? (
          <>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-handwriting mb-2">{t('modalTitle')}</h3>
              <p className="text-sm text-[#78716A]">{t('modalSubtitle')}</p>
            </div>

            <div className="border-2 border-[#E6C79C] bg-[#E6C79C]/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-[#E6C79C] text-[#2D2926] text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
               <h4 className="font-bold text-lg mb-1">{t('planName')}</h4>
               <p className="text-3xl font-handwriting text-[#2D2926] mb-4">$9.99<span className="text-sm text-[#78716A]">/month</span></p>
               <ul className="text-sm text-[#78716A] space-y-2 mb-0">
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> {t('benefit1')}</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> {t('benefit2')}</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> {t('benefit3')}</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> {t('benefit4')}</li>
               </ul>
            </div>

            {/* 실제 페이팔 결제 버튼으로 교체 */}
            <PayPalButton 
              amount="9.99" 
              onSuccess={() => setIsSuccess(true)} 
            />
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle size={60} className="mx-auto text-green-500 mb-6" />
            <h3 className="text-3xl font-handwriting mb-2">{t('successTitle')}</h3>
            <p className="text-sm text-[#78716A] mb-8">
              {t.rich('successBody', { br: () => <br /> })}
            </p>
            <button 
              className="bg-[#2D2926] text-white w-full py-3 rounded-lg font-bold"
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
            >
              {t('confirm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
