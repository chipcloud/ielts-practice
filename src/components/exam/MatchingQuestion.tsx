'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Premise {
  id: string;
  text: string;
}

interface Option {
  id: string;
  text: string;
}

interface MatchingQuestionProps {
  questionId: string;
  premises: Premise[];
  options: Option[];
  /**
   * Current answers keyed by premiseId.
   * e.g. { "P1": "A", "P2": "B" }
   */
  values: Record<string, string>;
  onChange: (premiseId: string, optionId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MatchingQuestion({
  questionId,
  premises,
  options,
  values,
  onChange,
  disabled = false,
  className,
}: MatchingQuestionProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-4', className)}>
      {premises.map((premise, idx) => (
        <div
          key={premise.id}
          className={cn(
            'flex items-center gap-4 p-4 rounded-lg border transition-colors',
            values[premise.id] ? 'border-green-300 bg-green-50/50' : 'border-border'
          )}
        >
          {/* Premise label */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              {premise.id}.
            </span>
            <span className="text-sm font-medium text-foreground">
              {premise.text}
            </span>
          </div>

          {/* Arrow */}
          <span className="text-muted-foreground flex-shrink-0">→</span>

          {/* Dropdown */}
          <select
            value={values[premise.id] || ''}
            onChange={(e) => onChange(premise.id, e.target.value)}
            disabled={disabled}
            className={cn(
              'w-48 flex-shrink-0',
              'h-9 px-3 py-1 text-sm',
              'border rounded-md bg-background',
              'focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none',
              'transition-colors',
              disabled && 'opacity-60 cursor-not-allowed',
              !values[premise.id] && 'text-muted-foreground',
            )}
          >
            <option value="">— {t('examSession.selectOption', 'Select')} —</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.id}. {opt.text}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
