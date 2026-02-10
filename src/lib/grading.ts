/**
 * IELTS Auto-Grading Logic
 *
 * Handles answer normalization, comparison, scoring, and band score calculation
 * for Listening and Reading modules.
 *
 * Supports all answer shapes:
 *  - string:                 single choice, T/F/NG, short answer
 *  - string[]:               multi-select
 *  - Record<string, string>: gap_fill (keyed by gapId), matching (keyed by premiseId)
 */

import type { GradingResult } from '@/types/exam';

// Any shape an answer can take
type AnswerValue = string | string[] | Record<string, string> | undefined;

// ---------- Answer Normalization ----------

export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/g, '');
}

function expandTFNG(answer: string): string {
  const normalized = normalizeAnswer(answer);
  const trueVariants = ['true', 't', 'yes', 'y'];
  const falseVariants = ['false', 'f', 'no', 'n'];
  const ngVariants = ['not given', 'ng', 'not_given', 'not given'];

  if (trueVariants.includes(normalized)) return 'true';
  if (falseVariants.includes(normalized)) return 'false';
  if (ngVariants.includes(normalized)) return 'not given';
  return normalized;
}

// ---------- Question Data ----------

interface QuestionData {
  id: string;
  questionStructure: {
    type: string;
    correctAnswer?: string | string[];
    alternativeAnswers?: string[];
    caseSensitive?: boolean;
    points: number;
    // gap_fill specific
    gaps?: { id: number; answer: string; alternatives?: string[] }[];
    // matching specific
    correctPairs?: Record<string, string>;
  };
}

// ---------- Helpers ----------

/** Safely convert any answer value to a display string */
function answerToString(val: AnswerValue): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  // Record<string, string>
  return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
}

/** Check if answer is empty */
function isEmptyAnswer(val: AnswerValue): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string') return val === '';
  if (Array.isArray(val)) return val.length === 0;
  return Object.keys(val).length === 0;
}

// ---------- Per-type Grading ----------

function gradeGapFill(
  question: QuestionData,
  userAnswer: AnswerValue
): GradingResult {
  const { id, questionStructure } = question;
  const { gaps = [], points, correctAnswer } = questionStructure;

  const userObj: Record<string, string> =
    (typeof userAnswer === 'object' && !Array.isArray(userAnswer))
      ? userAnswer as Record<string, string>
      : {};

  // If gaps array is present, grade per-gap
  if (gaps.length > 0) {
    let correctCount = 0;
    const totalGaps = gaps.length;

    for (let i = 0; i < gaps.length; i++) {
      const gap = gaps[i];
      const userVal = userObj[`gap_${i}`] || '';
      const correct = normalizeAnswer(gap.answer);
      const alts = (gap.alternatives || []).map(a => normalizeAnswer(a));
      const normalizedUser = normalizeAnswer(userVal);

      if (normalizedUser === correct || alts.includes(normalizedUser)) {
        correctCount++;
      }
    }

    // Points proportional to correct gaps
    const pointsPerGap = points / totalGaps;
    const earned = Math.round(correctCount * pointsPerGap * 100) / 100;

    return {
      questionId: id,
      userAnswer: answerToString(userAnswer),
      correctAnswer: gaps.map(g => g.answer).join(', '),
      isCorrect: correctCount === totalGaps,
      pointsEarned: earned,
      maxPoints: points,
    };
  }

  // Fallback: compare against correctAnswer array
  if (Array.isArray(correctAnswer)) {
    const userValues = Object.values(userObj);
    let correctCount = 0;
    for (let i = 0; i < correctAnswer.length; i++) {
      const expected = normalizeAnswer(correctAnswer[i]);
      const given = userValues[i] ? normalizeAnswer(userValues[i]) : '';
      if (given === expected) correctCount++;
    }
    const earned = Math.round((correctCount / correctAnswer.length) * points * 100) / 100;
    return {
      questionId: id,
      userAnswer: answerToString(userAnswer),
      correctAnswer: correctAnswer.join(', '),
      isCorrect: correctCount === correctAnswer.length,
      pointsEarned: earned,
      maxPoints: points,
    };
  }

  return {
    questionId: id,
    userAnswer: answerToString(userAnswer),
    correctAnswer: String(correctAnswer ?? ''),
    isCorrect: false,
    pointsEarned: 0,
    maxPoints: points,
  };
}

function gradeMatching(
  question: QuestionData,
  userAnswer: AnswerValue
): GradingResult {
  const { id, questionStructure } = question;
  const { correctPairs = {}, points } = questionStructure;

  const userObj: Record<string, string> =
    (typeof userAnswer === 'object' && !Array.isArray(userAnswer))
      ? userAnswer as Record<string, string>
      : {};

  const totalPairs = Object.keys(correctPairs).length;
  let correctCount = 0;

  for (const [premiseId, correctOptionId] of Object.entries(correctPairs)) {
    if (normalizeAnswer(userObj[premiseId] || '') === normalizeAnswer(correctOptionId)) {
      correctCount++;
    }
  }

  const pointsPerPair = totalPairs > 0 ? points / totalPairs : 0;
  const earned = Math.round(correctCount * pointsPerPair * 100) / 100;

  return {
    questionId: id,
    userAnswer: answerToString(userAnswer),
    correctAnswer: Object.entries(correctPairs).map(([k, v]) => `${k}→${v}`).join(', '),
    isCorrect: correctCount === totalPairs,
    pointsEarned: earned,
    maxPoints: points,
  };
}

function gradeStringAnswer(
  question: QuestionData,
  userAnswer: AnswerValue
): GradingResult {
  const { id, questionStructure } = question;
  const {
    type,
    correctAnswer = '',
    alternativeAnswers = [],
    caseSensitive = false,
    points,
  } = questionStructure;

  const userStr = typeof userAnswer === 'string' ? userAnswer : answerToString(userAnswer);

  if (!userStr) {
    return {
      questionId: id,
      userAnswer: '',
      correctAnswer,
      isCorrect: false,
      pointsEarned: 0,
      maxPoints: points,
    };
  }

  let isCorrect = false;

  switch (type) {
    case 'true_false_not_given':
    case 'yes_no_not_given':
    case 'boolean': {
      isCorrect = expandTFNG(userStr) === expandTFNG(String(correctAnswer));
      break;
    }
    case 'multiple_choice': {
      isCorrect = normalizeAnswer(userStr) === normalizeAnswer(String(correctAnswer));
      break;
    }
    default: {
      const process = caseSensitive ? (s: string) => s.trim() : normalizeAnswer;
      const processedUser = process(userStr);
      const allCorrect = [
        process(String(correctAnswer)),
        ...alternativeAnswers.map(a => process(a)),
      ];
      isCorrect = allCorrect.includes(processedUser);
      break;
    }
  }

  return {
    questionId: id,
    userAnswer: userStr,
    correctAnswer,
    isCorrect,
    pointsEarned: isCorrect ? points : 0,
    maxPoints: points,
  };
}

// ---------- Main Grading Entry ----------

export function gradeQuestion(
  question: QuestionData,
  userAnswer: AnswerValue
): GradingResult {
  const { type } = question.questionStructure;

  // Empty answer shortcut
  if (isEmptyAnswer(userAnswer)) {
    return {
      questionId: question.id,
      userAnswer: '',
      correctAnswer: question.questionStructure.correctAnswer ?? '',
      isCorrect: false,
      pointsEarned: 0,
      maxPoints: question.questionStructure.points,
    };
  }

  switch (type) {
    case 'gap_fill':
      return gradeGapFill(question, userAnswer);
    case 'matching':
      return gradeMatching(question, userAnswer);
    default:
      return gradeStringAnswer(question, userAnswer);
  }
}

// ---------- Full Exam Grading ----------

export function gradeExam(
  questions: QuestionData[],
  userAnswers: Record<string, AnswerValue>
): {
  results: GradingResult[];
  rawScore: number;
  maxScore: number;
  bandScore: number;
} {
  const results = questions.map(q => gradeQuestion(q, userAnswers[q.id]));
  const rawScore = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const maxScore = results.reduce((sum, r) => sum + r.maxPoints, 0);
  const bandScore = calculateBandScore(rawScore, maxScore);
  return { results, rawScore, maxScore, bandScore };
}

// ---------- Band Score Calculation ----------

const READING_BAND_TABLE: [number, number][] = [
  [40, 9.0], [39, 8.5], [37, 8.0], [35, 7.5], [33, 7.0],
  [30, 6.5], [27, 6.0], [23, 5.5], [19, 5.0], [15, 4.5],
  [13, 4.0], [10, 3.5], [6, 3.0], [4, 2.5], [1, 2.0], [0, 0.0],
];

export function calculateBandScore(rawScore: number, maxScore: number): number {
  const scaledScore = maxScore === 40
    ? rawScore
    : Math.round((rawScore / maxScore) * 40);

  for (const [minScore, band] of READING_BAND_TABLE) {
    if (scaledScore >= minScore) {
      return band;
    }
  }
  return 0;
}
