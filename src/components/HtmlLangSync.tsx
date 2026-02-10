'use client';

import { useEffect } from 'react';

/**
 * Syncs the <html> lang attribute with the current i18n language.
 * Uses dynamic import to get the i18n instance directly, avoiding
 * issues with useTranslation returning a partial object before init.
 */
export function HtmlLangSync() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    import('@/i18n').then((module) => {
      const i18n = module.default;

      const updateLang = (lng: string) => {
        document.documentElement.lang = lng;
      };

      // Set initial lang
      if (i18n.language) {
        updateLang(i18n.language);
      }

      // Listen for language changes
      i18n.on('languageChanged', updateLang);

      cleanup = () => {
        i18n.off('languageChanged', updateLang);
      };
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return null;
}
