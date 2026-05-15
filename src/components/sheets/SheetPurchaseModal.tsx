'use client';

import { X, Lock, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import PayPalButton from '@/components/PayPalButton';
import { SHEET_UNLOCK_PRICE_USD, SHEET_UNLOCK_VALID_DAYS, PREMIUM_MONTHLY_PRICE_USD } from '@/lib/pricing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string;
  sheetTitle?: string;
  // 결제 후 모달을 닫고 다운로드를 트리거할 수 있도록 콜백 제공
  onPurchased?: () => void;
}

/**
 * 단발 PDF $3 결제 모달.
 * - 시트별로 띄우며, 결제 완료 시 users/{uid}/purchasedSheets/{sheetId} 가 기록되어
 *   다운로드 API가 30일간 통과시켜 줍니다.
 */
export default function SheetPurchaseModal({ isOpen, onClose, sheetId, sheetTitle, onPurchased }: Props) {
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations('sheetPurchase');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={() => { setSuccess(false); onClose(); }}
          className="absolute top-5 right-5 text-[#78716A] hover:text-[#2D2926]"
          aria-label={t('close')}
        >
          <X size={22} />
        </button>

        {!success ? (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-brand-gold/15 mx-auto flex items-center justify-center border border-brand-gold/30 mb-3">
                <FileText className="w-7 h-7 text-brand-gold" />
              </div>
              <h3 className="text-2xl font-bold text-[#2D2926] mb-1">{t('title')}</h3>
              {sheetTitle && (
                <p className="text-sm text-[#78716A] truncate">{sheetTitle}</p>
              )}
            </div>

            <div className="border-2 border-brand-gold/40 bg-brand-gold/5 rounded-2xl p-5 mb-5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-semibold text-[#2D2926]">{t('oneTime')}</span>
                <span className="text-3xl font-extrabold text-[#2D2926]">
                  ${SHEET_UNLOCK_PRICE_USD}
                  <span className="text-xs font-medium text-[#78716A] ml-1">USD</span>
                </span>
              </div>
              <ul className="text-sm text-[#78716A] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-brand-gold mt-0.5 shrink-0" />
                  <span>{t.rich('benefit1', { b: (chunks) => <strong className="text-[#2D2926]">{chunks}</strong>, days: SHEET_UNLOCK_VALID_DAYS })}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-brand-gold mt-0.5 shrink-0" />
                  <span>{t('benefit2')}</span>
                </li>
              </ul>
            </div>

            <PayPalButton
              amount={SHEET_UNLOCK_PRICE_USD}
              purpose="sheet"
              sheetId={sheetId}
              onSuccess={() => setSuccess(true)}
            />

            <div className="mt-5 pt-5 border-t border-[#78716A]/15 text-center">
              <p className="text-xs text-[#78716A] mb-2">{t('membershipHint')}</p>
              <button
                onClick={() => { onClose(); router.push('/premium'); }}
                className="text-sm font-semibold text-brand-gold hover:underline inline-flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                {t('membershipCta', { monthly: PREMIUM_MONTHLY_PRICE_USD })}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-[#2D2926] mb-2">{t('successTitle')}</h3>
            <p className="text-sm text-[#78716A] mb-6">
              {t.rich('successBody', { b: (chunks) => <strong>{chunks}</strong>, days: SHEET_UNLOCK_VALID_DAYS })}
            </p>
            <button
              className="bg-[#2D2926] text-white w-full py-3 rounded-lg font-bold"
              onClick={() => {
                setSuccess(false);
                onClose();
                onPurchased?.();
              }}
            >
              {t('successDownload')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
