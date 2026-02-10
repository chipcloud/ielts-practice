'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { FileText, AlertTriangle } from 'lucide-react';

interface WritingEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Minimum required word count (e.g. 150 for Task 1, 250 for Task 2) */
  minWords?: number;
  /** The writing prompt text */
  prompt?: string;
  disabled?: boolean;
  className?: string;
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export function WritingEditor({
  value,
  onChange,
  minWords = 150,
  prompt,
  disabled = false,
  className,
}: WritingEditorProps) {
  const { t } = useTranslation();
  const wordCount = useMemo(() => countWords(value), [value]);

  const isUnderMinimum = wordCount > 0 && wordCount < minWords;
  const isOverMinimum = wordCount >= minWords;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Prompt */}
      {prompt && (
        <div className="bg-background border rounded-lg p-5 mb-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {t('writing.prompt')}
              </h3>
              <p className="text-foreground leading-relaxed">{prompt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex flex-col border rounded-lg bg-background overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          placeholder={t('writing.placeholder')}
          className={cn(
            'flex-1 w-full p-5 resize-none',
            'text-base leading-7 text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none',
            'font-serif',
            disabled && 'opacity-60 cursor-not-allowed bg-muted/40',
          )}
        />

        {/* Footer: Word Count */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/40">
          <div className="flex items-center gap-4">
            {/* Word count indicator */}
            <div className="flex items-center gap-2">
              {isUnderMinimum && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isOverMinimum
                    ? 'text-green-600'
                    : isUnderMinimum
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                )}
              >
                {t('writing.wordCount', { count: wordCount })}
              </span>
            </div>

            {/* Minimum requirement */}
            <span className="text-xs text-muted-foreground">
              {t('writing.minWords', { min: minWords })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                isOverMinimum ? 'bg-green-500' : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(100, (wordCount / minWords) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
