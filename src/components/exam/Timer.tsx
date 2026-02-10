'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useExamSession } from '@/store/examSession';
import { cn } from '@/lib/utils';
import { Clock, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Timer() {
  const { timeRemaining, isTimerRunning, tickTimer, status } = useExamSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isWarning = timeRemaining <= 300; // 5 minutes warning
  const isDanger = timeRemaining <= 60; // 1 minute danger

  useEffect(() => {
    if (isTimerRunning && status === 'in_progress') {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerRunning, status, tickTimer]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold transition-colors',
        isDanger
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-muted text-foreground'
      )}
    >
      <Clock className="h-5 w-5" />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
}
