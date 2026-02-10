'use client';

import { useEffect, useState, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [i18n, setI18n] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to ensure i18n is only initialized on client
    import('@/i18n').then((module) => {
      setI18n(module.default);
      setMounted(true);
    });
  }, []);

  // Show children without provider during SSR and initial mount
  if (!mounted || !i18n) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
