'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  /** 时间耗尽时自动调用的提交函数 */
  onTimeUp?: () => void;
  className?: string;
}

/**
 * 考试倒计时组件
 *
 * - 从 exam-store 读取 timeRemaining / isTimerRunning
 * - 每秒调用 tick()
 * - 时间耗尽时自动调用 onTimeUp 回调（交卷）
 * - 视觉提示：≤5 min 黄色警告，≤60 s 红色闪烁
 */
export function ExamTimer({ onTimeUp, className }: ExamTimerProps) {
  const { timeRemaining, isTimerRunning, status, tick } = useExamStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // 保持回调引用为最新值，避免 effect 重跑
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // ── 每秒 tick ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning || status !== 'in_progress') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const isUp = tick();
      if (isUp) {
        // 时间到——自动交卷
        onTimeUpRef.current?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerRunning, status, tick]);

  // ── 格式化 ────────────────────────────────────────────────────────
  const formatTime = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }, []);

  // ── 视觉等级 ──────────────────────────────────────────────────────
  const isWarning = timeRemaining > 0 && timeRemaining <= 300; // ≤5 min
  const isDanger = timeRemaining > 0 && timeRemaining <= 60;   // ≤1 min
  const isUp = timeRemaining <= 0 && status === 'completed';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold transition-colors select-none',
        isDanger
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isWarning
            ? 'bg-amber-100 text-amber-700'
            : isUp
              ? 'bg-border text-muted-foreground'
              : 'bg-muted text-foreground',
        className,
      )}
    >
      {isDanger ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span>{isUp ? '00:00' : formatTime(timeRemaining)}</span>
    </div>
  );
}
