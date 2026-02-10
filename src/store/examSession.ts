import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AttemptStatus, IELTSModule } from '@/types/exam';

interface ExamSessionState {
  attemptId: string | null;
  examId: string | null;
  module: IELTSModule | null;
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  flaggedQuestions: string[];
  timeRemaining: number;
  status: AttemptStatus;
  isTimerRunning: boolean;

  // Actions
  startExam: (examId: string, module: IELTSModule, attemptId: string, timeLimitMinutes: number) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  toggleFlagQuestion: (questionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  submitExam: () => void;
  reset: () => void;
}

const initialState = {
  attemptId: null,
  examId: null,
  module: null,
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: [],
  timeRemaining: 0,
  status: 'in_progress' as AttemptStatus,
  isTimerRunning: true,
};

export const useExamSession = create<ExamSessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startExam: (examId, module, attemptId, timeLimitMinutes) => {
        set({
          examId,
          module,
          attemptId,
          timeRemaining: timeLimitMinutes * 60,
          status: 'in_progress',
          isTimerRunning: true,
        });
      },

      setAnswer: (questionId, answer) => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        }));
      },

      toggleFlagQuestion: (questionId) => {
        set((state) => {
          const isFlagged = state.flaggedQuestions.includes(questionId);
          return {
            flaggedQuestions: isFlagged
              ? state.flaggedQuestions.filter((id) => id !== questionId)
              : [...state.flaggedQuestions, questionId],
          };
        });
      },

      nextQuestion: () => {
        set((state) => ({
          currentQuestionIndex: state.currentQuestionIndex + 1,
        }));
      },

      previousQuestion: () => {
        set((state) => ({
          currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
        }));
      },

      goToQuestion: (index) => {
        set({ currentQuestionIndex: index });
      },

      tickTimer: () => {
        set((state) => {
          if (!state.isTimerRunning || state.timeRemaining <= 0) {
            return state;
          }
          const newTime = state.timeRemaining - 1;
          if (newTime <= 0) {
            return { timeRemaining: 0, status: 'completed', isTimerRunning: false };
          }
          return { timeRemaining: newTime };
        });
      },

      pauseTimer: () => {
        set({ isTimerRunning: false });
      },

      resumeTimer: () => {
        set({ isTimerRunning: true });
      },

      submitExam: () => {
        set({ status: 'completed', isTimerRunning: false });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'ielts-exam-session',
      partialize: (state) => ({
        attemptId: state.attemptId,
        examId: state.examId,
        module: state.module,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        flaggedQuestions: state.flaggedQuestions,
        timeRemaining: state.timeRemaining,
        status: state.status,
      }),
    }
  )
);
