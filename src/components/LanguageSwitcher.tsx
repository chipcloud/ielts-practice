'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState('zh');
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to get i18n instance
    import('@/i18n').then((module) => {
      const i18n = module.default;
      setI18nInstance(i18n);
      setCurrentLanguage(i18n.language || 'zh');

      // Listen for language changes
      const handleLanguageChanged = (lng: string) => {
        setCurrentLanguage(lng);
      };

      i18n.on('languageChanged', handleLanguageChanged);

      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
      };
    });
  }, []);

  const switchLanguage = (lng: string) => {
    if (i18nInstance) {
      i18nInstance.changeLanguage(lng);
    }
  };

  // Don't render until i18n is ready
  if (!i18nInstance) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" disabled>
        <Globe className="h-4 w-4" />
        <span className="uppercase">--</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="uppercase">{currentLanguage === 'zh' ? '中' : 'EN'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLanguage('en')}>
          English {currentLanguage === 'en' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLanguage('zh')}>
          中文 {currentLanguage === 'zh' && '✓'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
