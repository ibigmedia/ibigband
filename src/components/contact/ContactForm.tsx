'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

// 통합 문의함으로 보낸다. 메일로도 알림이 간다.
const CONTACT_URL = 'https://work.ibigstudio.com/api/contact';
const TYPES = ['typeWorship', 'typeSheets', 'typeMembership', 'typePartnership', 'typeSupport', 'typeOther'] as const;
const fieldCls = 'mt-1.5 w-full rounded-xl border border-[#E0DBD0] bg-white px-4 py-3 text-[#121110] outline-none placeholder:text-[#6B665F] focus:border-[#121110]';

export default function ContactForm({ lang }: { lang: 'ko' | 'en' }) {
  const t = useTranslations('contact');
  const [form, setForm] = useState({ name: '', email: '', type: '', message: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch(CONTACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('sent');
    } catch {
      setState('failed');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="rounded-[18px] border border-[#E0DBD0] bg-[#FFFDF9] p-8">
        <h2 className="text-2xl font-bold text-[#121110]">{t('sentTitle')}</h2>
        <p className="mt-3 text-t-muted">{t('sentBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[18px] border border-[#E0DBD0] bg-[#FFFDF9] p-6 md:p-8">
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#121110]">
          {t('name')}
          <input required maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} className={fieldCls} />
        </label>
        <label className="block text-sm font-semibold text-[#121110]">
          {t('replyEmail')}
          <input required type="email" maxLength={160} autoComplete="email" value={form.email} onChange={set('email')} className={fieldCls} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-[#121110]">
        {t('type')}
        <select required value={form.type} onChange={set('type')} className={fieldCls}>
          <option value="">{t('typePlaceholder')}</option>
          {TYPES.map((k) => <option key={k} value={t(k)}>{t(k)}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-[#121110]">
        {t('message')}
        <textarea required rows={7} maxLength={4000} value={form.message} onChange={set('message')} className={`${fieldCls} resize-y`} />
      </label>
      {state === 'failed' && <p role="alert" className="rounded-xl bg-[#F8D9CC] px-4 py-3 text-[#121110]">{t('failed')}</p>}
      <button type="submit" disabled={state === 'sending'} className="rounded-full bg-[#121110] px-7 py-3.5 font-semibold text-white transition hover:bg-[#B3350F] disabled:opacity-70">
        {state === 'sending' ? t('sending') : t('send')}
      </button>
    </form>
  );
}
