'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Regex to match {{gap}} or {{gap:id}} placeholders in text.
 * - {{gap}}       → auto-indexed gap (gap_0, gap_1, ...)
 * - {{gap:myId}}  → named gap with explicit ID
 */
const GAP_PATTERN = /\{\{gap(?::(\w+))?\}\}/g;

interface GapSegment {
  type: 'text';
  value: string;
}

interface InputSegment {
  type: 'input';
  gapId: string;
  index: number;
}

type Segment = GapSegment | InputSegment;

/**
 * Parse a gapText string into an array of text and input segments.
 *
 * Example:
 *   "The capital of {{gap}} is {{gap:city}}."
 *   → [
 *       { type: 'text', value: 'The capital of ' },
 *       { type: 'input', gapId: 'gap_0', index: 0 },
 *       { type: 'text', value: ' is ' },
 *       { type: 'input', gapId: 'city', index: 1 },
 *       { type: 'text', value: '.' },
 *     ]
 */
function parseGapText(gapText: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let gapIndex = 0;

  // Reset regex state
  GAP_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = GAP_PATTERN.exec(gapText)) !== null) {
    // Text before this gap
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: gapText.slice(lastIndex, match.index),
      });
    }

    // The gap itself
    const explicitId = match[1]; // captured from {{gap:id}}
    segments.push({
      type: 'input',
      gapId: explicitId || `gap_${gapIndex}`,
      index: gapIndex,
    });

    gapIndex++;
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last gap
  if (lastIndex < gapText.length) {
    segments.push({
      type: 'text',
      value: gapText.slice(lastIndex),
    });
  }

  return segments;
}

// ─── Component Props ──────────────────────────────────────────────

interface GapFillQuestionProps {
  /** The question ID (used for answer keys) */
  questionId: string;
  /** Text with {{gap}} placeholders */
  gapText: string;
  /**
   * Current answers keyed by gapId.
   * e.g. { "gap_0": "France", "gap_1": "Paris" }
   */
  values: Record<string, string>;
  /** Called when any gap value changes */
  onChange: (gapId: string, value: string) => void;
  /** Whether inputs are disabled (e.g., after submission) */
  disabled?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────

export function GapFillQuestion({
  questionId,
  gapText,
  values,
  onChange,
  disabled = false,
  className,
}: GapFillQuestionProps) {
  const [segments] = useState<Segment[]>(() => parseGapText(gapText));

  return (
    <div className={cn('leading-8 text-base text-foreground', className)}>
      {segments.map((segment, idx) => {
        if (segment.type === 'text') {
          return (
            <span key={idx}>
              {segment.value}
            </span>
          );
        }

        // Input segment
        return (
          <InlineInput
            key={`${questionId}-${segment.gapId}`}
            gapId={segment.gapId}
            index={segment.index}
            value={values[segment.gapId] || ''}
            onChange={onChange}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

// ─── Inline Input ─────────────────────────────────────────────────

interface InlineInputProps {
  gapId: string;
  index: number;
  value: string;
  onChange: (gapId: string, value: string) => void;
  disabled: boolean;
}

function InlineInput({ gapId, index, value, onChange, disabled }: InlineInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Dynamic width: at least 80px, grows with content
  const minWidth = 80;
  const charWidth = 9; // approximate px per character
  const width = Math.max(minWidth, (value.length + 2) * charWidth);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(gapId, e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      placeholder={`(${index + 1})`}
      aria-label={`Answer for gap ${index + 1}`}
      className={cn(
        // Inline alignment
        'inline-block align-baseline mx-1',
        // Sizing
        'h-8 px-2 py-0.5 text-sm',
        // Border & shape
        'border-b-2 border-t-0 border-l-0 border-r-0 rounded-none',
        'bg-transparent',
        // Typography
        'text-center font-medium text-foreground',
        // Placeholder
        'placeholder:text-muted-foreground placeholder:font-normal placeholder:text-xs',
        // States
        isFocused
          ? 'border-primary outline-none'
          : value
            ? 'border-green-500'
            : 'border-border',
        // Disabled
        disabled && 'opacity-60 cursor-not-allowed',
        // Transition
        'transition-colors duration-150',
      )}
      style={{ width: `${width}px` }}
    />
  );
}

// ─── Export parser for testing ─────────────────────────────────────

export { parseGapText };
