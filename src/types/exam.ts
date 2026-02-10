// IELTS Exam Type Definitions

export type IELTSModule = 'listening' | 'reading' | 'writing' | 'speaking';
export type ExamType = 'Academic' | 'General';
export type AttemptStatus = 'in_progress' | 'completed';

// Question Types
export type QuestionType =
  | 'multiple_choice'
  | 'matching'
  | 'map_labeling'
  | 'form_completion'
  | 'note_completion'
  | 'sentence_completion'
  | 'short_answer'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'diagram_labeling'
  | 'flowchart_completion';

// Question Structure for JSONB
export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionStructure {
  type: QuestionType;
  instruction: string;
  questionText?: string;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  alternativeAnswers?: string[];
  caseSensitive?: boolean;
  maxWords?: number;
  points: number;
}

// Content for JSONB
export interface ListeningContent {
  audioUrl: string;
  transcript?: string;
  sections: {
    id: number;
    instruction: string;
    context: string;
  }[];
}

export interface ReadingContent {
  passage: string;
  title: string;
  source?: string;
  wordCount: number;
}

export interface WritingContent {
  taskType: 'task1' | 'task2';
  prompt: string;
  imageUrl?: string; // For Task 1 diagrams/charts
  minWords: number;
  suggestedTime: number; // in minutes
}

export interface SpeakingContent {
  part: 1 | 2 | 3;
  instructions: string[];
  preparationTime?: number;
  speakingTime?: number;
  followUpQuestions?: string[];
}

// Exam Session State (Zustand)
export interface ExamSessionState {
  attemptId: string | null;
  examId: string | null;
  module: IELTSModule | null;
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  flaggedQuestions: string[];
  timeRemaining: number; // in seconds
  status: AttemptStatus;

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

// API Response Types
export interface ExamListItem {
  id: string;
  name: string;
  type: ExamType;
  isPublished: boolean;
  questionCount: number;
  timeLimitMinutes: number;
}

export interface ExamDetail extends ExamListItem {
  questions: QuestionDetail[];
}

export interface QuestionDetail {
  id: string;
  questionNumber: number;
  module: IELTSModule;
  content: ListeningContent | ReadingContent | WritingContent | SpeakingContent;
  structure: QuestionStructure;
}

// Grading Types
export interface GradingResult {
  questionId: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
}

export interface ExamResult {
  attemptId: string;
  rawScore: number;
  maxScore: number;
  bandScore: number;
  questionResults: GradingResult[];
  timeSpentMinutes: number;
  completedAt: Date;
}
