'use server';

/**
 * Server Action — 交卷判分
 *
 * 1. 接收 examId + 用户答案 Map
 * 2. 从数据库拉取该考试的所有题目（含正确答案）
 * 3. 逐题对比判分（填空题忽略大小写）
 * 4. 计算总分和 Band Score
 * 5. 返回完整评分结果
 */

import { db } from '@/db';
import { questions, userAttempts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Any shape a user answer can take */
type AnswerValue = string | string[] | Record<string, string>;

interface GapDef {
  id: number;
  answer: string;
  alternatives?: string[];
}

interface QuestionStructure {
  type: string;
  correctAnswer?: string | string[];
  alternativeAnswers?: string[];
  caseSensitive?: boolean;
  points: number;
  gaps?: GapDef[];
  correctPairs?: Record<string, string>;
}

interface QuestionResult {
  questionId: string;
  questionNumber: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
}

export interface SubmitExamResult {
  success: boolean;
  error?: string;
  data?: {
    rawScore: number;
    maxScore: number;
    bandScore: number;
    accuracy: number;
    questionResults: QuestionResult[];
    completedAt: string;
  };
}

// ---------------------------------------------------------------------------
// Answer normalisation helpers
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/g, '');
}

function expandTFNG(s: string): string {
  const n = normalize(s);
  if (['true', 't', 'yes', 'y'].includes(n)) return 'true';
  if (['false', 'f', 'no', 'n'].includes(n)) return 'false';
  if (['not given', 'ng', 'not_given'].includes(n)) return 'not given';
  return n;
}

function answerToString(val: AnswerValue | undefined): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  return Object.entries(val)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

// ---------------------------------------------------------------------------
// Per-type grading
// ---------------------------------------------------------------------------

function gradeGapFill(
  qs: QuestionStructure,
  userAnswer: AnswerValue | undefined,
): { correct: number; total: number; earned: number } {
  const { gaps = [], correctAnswer, points } = qs;
  const userObj: Record<string, string> =
    typeof userAnswer === 'object' && !Array.isArray(userAnswer)
      ? (userAnswer as Record<string, string>)
      : {};

  // Strategy A: structured gaps array
  if (gaps.length > 0) {
    let hit = 0;
    for (let i = 0; i < gaps.length; i++) {
      const gap = gaps[i];
      const userVal = normalize(userObj[`gap_${i}`] ?? '');
      const correct = normalize(gap.answer);
      const alts = (gap.alternatives ?? []).map(normalize);
      if (userVal === correct || alts.includes(userVal)) hit++;
    }
    const earned = Math.round((hit / gaps.length) * points * 100) / 100;
    return { correct: hit, total: gaps.length, earned };
  }

  // Strategy B: flat correctAnswer array
  if (Array.isArray(correctAnswer)) {
    const vals = Object.values(userObj);
    let hit = 0;
    for (let i = 0; i < correctAnswer.length; i++) {
      if (normalize(vals[i] ?? '') === normalize(correctAnswer[i])) hit++;
    }
    const earned = Math.round((hit / correctAnswer.length) * points * 100) / 100;
    return { correct: hit, total: correctAnswer.length, earned };
  }

  return { correct: 0, total: 1, earned: 0 };
}

function gradeMatching(
  qs: QuestionStructure,
  userAnswer: AnswerValue | undefined,
): { correct: number; total: number; earned: number } {
  const { correctPairs = {}, points } = qs;
  const userObj: Record<string, string> =
    typeof userAnswer === 'object' && !Array.isArray(userAnswer)
      ? (userAnswer as Record<string, string>)
      : {};

  const total = Object.keys(correctPairs).length;
  let hit = 0;
  for (const [pid, cid] of Object.entries(correctPairs)) {
    if (normalize(userObj[pid] ?? '') === normalize(cid)) hit++;
  }
  const earned = Math.round((hit / Math.max(total, 1)) * points * 100) / 100;
  return { correct: hit, total, earned };
}

function gradeString(
  qs: QuestionStructure,
  userAnswer: AnswerValue | undefined,
): boolean {
  const userStr = typeof userAnswer === 'string' ? userAnswer : answerToString(userAnswer);
  if (!userStr) return false;

  const {
    type,
    correctAnswer = '',
    alternativeAnswers = [],
    caseSensitive = false,
  } = qs;

  switch (type) {
    case 'true_false_not_given':
    case 'yes_no_not_given':
    case 'boolean':
      return expandTFNG(userStr) === expandTFNG(String(correctAnswer));

    case 'multiple_choice':
      return normalize(userStr) === normalize(String(correctAnswer));

    default: {
      const fn = caseSensitive ? (s: string) => s.trim() : normalize;
      const processed = fn(userStr);
      return [
        fn(String(correctAnswer)),
        ...alternativeAnswers.map((a) => fn(a)),
      ].includes(processed);
    }
  }
}

// ---------------------------------------------------------------------------
// Band Score conversion (IELTS Academic Reading/Listening)
// ---------------------------------------------------------------------------

const BAND_TABLE: [number, number][] = [
  [40, 9.0], [39, 8.5], [37, 8.0], [35, 7.5], [33, 7.0],
  [30, 6.5], [27, 6.0], [23, 5.5], [19, 5.0], [15, 4.5],
  [13, 4.0], [10, 3.5], [6, 3.0],  [4, 2.5],  [1, 2.0],
  [0, 0.0],
];

function toBandScore(raw: number, max: number): number {
  const scaled = max === 40 ? raw : Math.round((raw / Math.max(max, 1)) * 40);
  for (const [min, band] of BAND_TABLE) {
    if (scaled >= min) return band;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Main Server Action
// ---------------------------------------------------------------------------

export async function submitExam(
  examId: string,
  userAnswers: Record<string, AnswerValue>,
  attemptId?: string,
): Promise<SubmitExamResult> {
  try {
    // 1. 从数据库拉取该考试的所有题目
    const rows = await db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId));

    if (rows.length === 0) {
      return { success: false, error: '找不到该考试的题目数据' };
    }

    // 2. 逐题判分
    let totalEarned = 0;
    let totalMax = 0;

    const questionResults: QuestionResult[] = rows.map((row) => {
      const qs = row.questionStructure as QuestionStructure;
      const ua = userAnswers[row.id];
      const points = qs.points ?? 1;

      let earned = 0;
      let isCorrect = false;
      let correctDisplay = '';

      switch (qs.type) {
        case 'gap_fill': {
          const r = gradeGapFill(qs, ua);
          earned = r.earned;
          isCorrect = r.correct === r.total;
          correctDisplay = qs.gaps
            ? qs.gaps.map((g) => g.answer).join(', ')
            : Array.isArray(qs.correctAnswer)
              ? qs.correctAnswer.join(', ')
              : String(qs.correctAnswer ?? '');
          break;
        }

        case 'matching': {
          const r = gradeMatching(qs, ua);
          earned = r.earned;
          isCorrect = r.correct === r.total;
          correctDisplay = Object.entries(qs.correctPairs ?? {})
            .map(([k, v]) => `${k}→${v}`)
            .join(', ');
          break;
        }

        default: {
          isCorrect = gradeString(qs, ua);
          earned = isCorrect ? points : 0;
          correctDisplay = Array.isArray(qs.correctAnswer)
            ? qs.correctAnswer.join(', ')
            : String(qs.correctAnswer ?? '');
          break;
        }
      }

      totalEarned += earned;
      totalMax += points;

      return {
        questionId: row.id,
        questionNumber: row.questionNumber,
        userAnswer: answerToString(ua),
        correctAnswer: correctDisplay,
        isCorrect,
        pointsEarned: earned,
        maxPoints: points,
      };
    });

    // 3. 计算 Band Score
    const bandScore = toBandScore(totalEarned, totalMax);
    const accuracy = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

    // 持久化到 user_attempts 表
    try {
      const session = await auth();
      if (session?.user?.id && attemptId) {
        await db
          .update(userAttempts)
          .set({
            userAnswers: userAnswers as any,
            score: totalEarned,
            bandScore,
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userAttempts.id, attemptId));
      }
    } catch (e) {
      console.warn('Failed to persist attempt to DB:', e);
      // 不阻塞返回结果
    }

    return {
      success: true,
      data: {
        rawScore: totalEarned,
        maxScore: totalMax,
        bandScore,
        accuracy,
        questionResults: questionResults.sort((a, b) => a.questionNumber - b.questionNumber),
        completedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('submitExam error:', error);
    return { success: false, error: '判分过程出错，请重试' };
  }
}
