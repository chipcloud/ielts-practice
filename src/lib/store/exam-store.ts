import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Any shape a user answer can take */
export type AnswerValue = string | string[] | Record<string, string>;

export type ExamStatus = 'idle' | 'in_progress' | 'completed';

export interface ExamStoreState {
  // ── Session identifiers ──────────────────────────────────────────────
  attemptId: string | null;
  examId: string | null;
  module: string | null;

  // ── Answer map: questionId → user answer ─────────────────────────────
  answers: Record<string, AnswerValue>;

  // ── Timer ────────────────────────────────────────────────────────────
  timeRemaining: number; // seconds
  isTimerRunning: boolean;

  // ── Navigation & UI ──────────────────────────────────────────────────
  currentQuestionIndex: number;
  totalQuestions: number;
  flaggedQuestions: string[];
  status: ExamStatus;
}

export interface ExamStoreActions {
  /** Initialise a new exam session (resets everything first) */
  initExam: (params: {
    examId: string;
    module: string;
    attemptId: string;
    timeLimitMinutes: number;
    totalQuestions: number;
  }) => void;

  /** Store / update an answer for a given question */
  setAnswer: (questionId: string, value: AnswerValue) => void;

  /** Remove an answer (clear selection) */
  clearAnswer: (questionId: string) => void;

  /** Decrement timer by 1 s — returns `true` when time is up */
  tick: () => boolean;

  /** Pause / resume the countdown */
  pauseTimer: () => void;
  resumeTimer: () => void;

  /** Question navigation */
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;

  /** Flag / un-flag a question for review */
  toggleFlag: (questionId: string) => void;

  /** Mark exam as completed (stops timer) */
  complete: () => void;

  /** Full reset back to idle */
  reset: () => void;
}

type ExamStore = ExamStoreState & ExamStoreActions;

// ---------------------------------------------------------------------------
// Initial (idle) state
// ---------------------------------------------------------------------------

const INITIAL_STATE: ExamStoreState = {
  attemptId: null,
  examId: null,
  module: null,
  answers: {},
  timeRemaining: 0,
  isTimerRunning: false,
  currentQuestionIndex: 0,
  totalQuestions: 0,
  flaggedQuestions: [],
  status: 'idle',
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Init ────────────────────────────────────────────────────────
      initExam: ({ examId, module, attemptId, timeLimitMinutes, totalQuestions }) => {
        set({
          ...INITIAL_STATE,
          examId,
          module,
          attemptId,
          timeRemaining: timeLimitMinutes * 60,
          totalQuestions,
          isTimerRunning: true,
          status: 'in_progress',
        });
      },

      // ── Answers ─────────────────────────────────────────────────────
      setAnswer: (questionId, value) =>
        set((s) => ({
          answers: { ...s.answers, [questionId]: value },
        })),

      clearAnswer: (questionId) =>
        set((s) => {
          const { [questionId]: _, ...rest } = s.answers;
          return { answers: rest };
        }),

      // ── Timer ───────────────────────────────────────────────────────
      tick: () => {
        const { isTimerRunning, timeRemaining, status } = get();
        if (!isTimerRunning || status !== 'in_progress') return false;

        const next = timeRemaining - 1;
        if (next <= 0) {
          set({ timeRemaining: 0, isTimerRunning: false, status: 'completed' });
          return true; // time is up
        }
        set({ timeRemaining: next });
        return false;
      },

      pauseTimer: () => set({ isTimerRunning: false }),
      resumeTimer: () => {
        if (get().status === 'in_progress') set({ isTimerRunning: true });
      },

      // ── Navigation ──────────────────────────────────────────────────
      goTo: (index) => {
        const { totalQuestions } = get();
        if (index >= 0 && index < totalQuestions) {
          set({ currentQuestionIndex: index });
        }
      },

      next: () => {
        const { currentQuestionIndex, totalQuestions } = get();
        if (currentQuestionIndex < totalQuestions - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prev: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      // ── Flags ───────────────────────────────────────────────────────
      toggleFlag: (questionId) =>
        set((s) => {
          const flagged = s.flaggedQuestions.includes(questionId);
          return {
            flaggedQuestions: flagged
              ? s.flaggedQuestions.filter((id) => id !== questionId)
              : [...s.flaggedQuestions, questionId],
          };
        }),

      // ── Completion ──────────────────────────────────────────────────
      complete: () =>
        set({ status: 'completed', isTimerRunning: false }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'ielts-exam-session', // localStorage key
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      // Only persist the data fields, not functions
      partialize: (state) => ({
        attemptId: state.attemptId,
        examId: state.examId,
        module: state.module,
        answers: state.answers,
        timeRemaining: state.timeRemaining,
        isTimerRunning: state.isTimerRunning,
        currentQuestionIndex: state.currentQuestionIndex,
        totalQuestions: state.totalQuestions,
        flaggedQuestions: state.flaggedQuestions,
        status: state.status,
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// Hydration hook — 等 persist 中间件从 sessionStorage 恢复完再执行逻辑
// ---------------------------------------------------------------------------

export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 如果已经水合完成，直接标记
    if (useExamStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // 否则等待水合完成
    const unsub = useExamStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => unsub();
  }, []);

  return hydrated;
}
