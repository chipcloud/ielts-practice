'use client';

import { useTranslation } from 'react-i18next';
import { useExamStore } from '@/lib/store/exam-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Flag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionNavigationProps {
  questionIds: string[];
}

export function QuestionNavigation({ questionIds }: QuestionNavigationProps) {
  const { t } = useTranslation();
  const {
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    goTo,
  } = useExamStore();

  return (
    <div className="w-64 border-l bg-muted/40 p-4 flex flex-col">
      <h3 className="font-semibold text-foreground mb-4">{t('examSession.navigator')}</h3>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-4 gap-2">
          {questionIds.map((qId, i) => {
            const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
            const isFlagged = flaggedQuestions.includes(qId);
            const isCurrent = i === currentQuestionIndex;

            return (
              <Button
                key={qId}
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-10 w-10 p-0 relative',
                  isAnswered && !isCurrent && 'bg-green-50 border-green-300 text-green-700',
                  isFlagged && 'border-orange-300',
                )}
                onClick={() => goTo(i)}
              >
                {i + 1}
                {isAnswered && (
                  <Check className="h-2 w-2 absolute -top-1 -right-1 text-green-600" />
                )}
                {isFlagged && (
                  <Flag className="h-2 w-2 absolute -bottom-1 -right-1 text-orange-500 fill-orange-500" />
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-green-50 border border-green-300 rounded" />
          <span className="text-muted-foreground">{t('examSession.answered')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border border-orange-300 rounded" />
          <span className="text-muted-foreground">{t('examSession.flagged')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-primary rounded" />
          <span className="text-muted-foreground">{t('examSession.current')}</span>
        </div>
      </div>
    </div>
  );
}
