'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Detect and apply saved language preference on client
    const saved = localStorage.getItem('i18nextLng');
    if (saved && (saved === 'en' || saved === 'zh')) {
      i18n.changeLanguage(saved);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
