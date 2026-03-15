"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { X, CheckCircle } from 'lucide-react';
import PayPalButton from '@/components/PayPalButton'; // 새로 만든 페이팔 버튼 임포트

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user, userData } = useAuth();
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
              <h3 className="text-3xl font-handwriting mb-2">프리미엄 멤버십</h3>
              <p className="text-sm text-[#78716A]">모든 고화질 악보와 연습용 음원을 무제한으로 열람하세요.</p>
            </div>

            <div className="border-2 border-[#E6C79C] bg-[#E6C79C]/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-[#E6C79C] text-[#2D2926] text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
               <h4 className="font-bold text-lg mb-1">월간 정기구독</h4>
               <p className="text-3xl font-handwriting text-[#2D2926] mb-4">$9.99<span className="text-sm text-[#78716A]">/month</span></p>
               <ul className="text-sm text-[#78716A] space-y-2 mb-0">
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> PDF 악보 무제한 다운</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> 오리지널 MR 다운</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> 셋리스트 캘린더 연동</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#E6C79C]"/> 무제한 AI 추천, 태깅</li>
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
            <h3 className="text-3xl font-handwriting mb-2">결제 및 권한 승격 완료!</h3>
            <p className="text-sm text-[#78716A] mb-8">
              이제 모든 프리미엄 혜택을 이용하실 수 있습니다.<br/> ibiGband와 함께 찬양을 나누세요.
            </p>
            <button 
              className="bg-[#2D2926] text-white w-full py-3 rounded-lg font-bold"
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
