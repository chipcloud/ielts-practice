export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { questions, exams, userAttempts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  calculateBandScore,
  bandScoreLabel,
  bandScoreColor,
} from '@/lib/utils/scoring';
import { ResultClient } from './result-client';

// ---------------------------------------------------------------------------
// Types shared between server & client
// ---------------------------------------------------------------------------

export interface QuestionResult {
  questionId: string;
  questionNumber: number;
  /** 题型 */
  type: string;
  /** 题目文本 */
  questionText: string;
  /** 完整 instruction (e.g. "Choose the correct letter…") */
  instruction: string;
  /** 用户作答（展示用字符串） */
  userAnswer: string;
  /** 正确答案（展示用字符串） */
  correctAnswer: string;
  /** 是否正确 */
  isCorrect: boolean;
  /** 得分 */
  pointsEarned: number;
  /** 满分 */
  maxPoints: number;
  /** 解析 */
  explanation: string;
}

export interface ExamResultData {
  examName: string;
  module: string;
  bandScore: number;
  bandLabel: string;
  bandColor: ReturnType<typeof bandScoreColor>;
  rawScore: number;
  maxScore: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  timeSpent: string;
  completedAt: string;
  questionResults: QuestionResult[];
}

// ---------------------------------------------------------------------------
// Answer normalisation (same logic as submit-exam.ts)
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

function answerToDisplayString(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(val);
}

// ---------------------------------------------------------------------------
// Per-question grading (mirrors submit-exam.ts logic for correctness display)
// ---------------------------------------------------------------------------

interface QS {
  type: string;
  instruction?: string;
  questionText?: string;
  correctAnswer?: string | string[];
  alternativeAnswers?: string[];
  caseSensitive?: boolean;
  points: number;
  gaps?: { id: number; answer: string; alternatives?: string[] }[];
  correctPairs?: Record<string, string>;
  explanation?: string;
}

function gradeOne(
  qs: QS,
  userAnswer: unknown,
): { isCorrect: boolean; earned: number; correctDisplay: string } {
  const points = qs.points ?? 1;

  switch (qs.type) {
    case 'gap_fill': {
      const gaps = qs.gaps ?? [];
      const userObj: Record<string, string> =
        typeof userAnswer === 'object' && userAnswer && !Array.isArray(userAnswer)
          ? (userAnswer as Record<string, string>)
          : {};

      if (gaps.length > 0) {
        let hit = 0;
        for (let i = 0; i < gaps.length; i++) {
          const g = gaps[i];
          const uv = normalize(userObj[`gap_${i}`] ?? '');
          const cv = normalize(g.answer);
          const alts = (g.alternatives ?? []).map(normalize);
          if (uv === cv || alts.includes(uv)) hit++;
        }
        const earned = Math.round((hit / gaps.length) * points * 100) / 100;
        return {
          isCorrect: hit === gaps.length,
          earned,
          correctDisplay: gaps.map((g) => g.answer).join(', '),
        };
      }

      if (Array.isArray(qs.correctAnswer)) {
        const vals = Object.values(userObj);
        let hit = 0;
        for (let i = 0; i < qs.correctAnswer.length; i++) {
          if (normalize(vals[i] ?? '') === normalize(qs.correctAnswer[i])) hit++;
        }
        const earned = Math.round((hit / qs.correctAnswer.length) * points * 100) / 100;
        return {
          isCorrect: hit === qs.correctAnswer.length,
          earned,
          correctDisplay: qs.correctAnswer.join(', '),
        };
      }
      return { isCorrect: false, earned: 0, correctDisplay: String(qs.correctAnswer ?? '') };
    }

    case 'matching': {
      const pairs = qs.correctPairs ?? {};
      const userObj: Record<string, string> =
        typeof userAnswer === 'object' && userAnswer && !Array.isArray(userAnswer)
          ? (userAnswer as Record<string, string>)
          : {};
      const total = Object.keys(pairs).length;
      let hit = 0;
      for (const [pid, cid] of Object.entries(pairs)) {
        if (normalize(userObj[pid] ?? '') === normalize(cid)) hit++;
      }
      const earned = Math.round((hit / Math.max(total, 1)) * points * 100) / 100;
      return {
        isCorrect: hit === total,
        earned,
        correctDisplay: Object.entries(pairs).map(([k, v]) => `${k} → ${v}`).join(', '),
      };
    }

    case 'true_false_not_given':
    case 'yes_no_not_given':
    case 'boolean': {
      const us = typeof userAnswer === 'string' ? userAnswer : answerToDisplayString(userAnswer);
      const isCorrect = expandTFNG(us) === expandTFNG(String(qs.correctAnswer ?? ''));
      return {
        isCorrect,
        earned: isCorrect ? points : 0,
        correctDisplay: String(qs.correctAnswer ?? ''),
      };
    }

    case 'multiple_choice': {
      const us = typeof userAnswer === 'string' ? userAnswer : answerToDisplayString(userAnswer);
      const isCorrect = normalize(us) === normalize(String(qs.correctAnswer ?? ''));
      return {
        isCorrect,
        earned: isCorrect ? points : 0,
        correctDisplay: String(qs.correctAnswer ?? ''),
      };
    }

    default: {
      const us = typeof userAnswer === 'string' ? userAnswer : answerToDisplayString(userAnswer);
      if (!us) return { isCorrect: false, earned: 0, correctDisplay: String(qs.correctAnswer ?? '') };
      const fn = qs.caseSensitive ? (s: string) => s.trim() : normalize;
      const allCorrect = [
        fn(String(qs.correctAnswer ?? '')),
        ...(qs.alternativeAnswers ?? []).map((a) => fn(a)),
      ];
      const isCorrect = allCorrect.includes(fn(us));
      return {
        isCorrect,
        earned: isCorrect ? points : 0,
        correctDisplay: String(qs.correctAnswer ?? ''),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Server Component — Data fetching + grading
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExamResultPage({ params, searchParams }: PageProps) {
  const { attemptId } = await params;
  const sp = await searchParams;

  // ── Strategy 1: examId in query params (just-submitted flow)
  let examId = typeof sp.examId === 'string' ? sp.examId : null;
  let userAnswers: Record<string, unknown> = {};
  let attemptRow: typeof userAttempts.$inferSelect | null = null;

  // ── Strategy 2: attemptId → DB lookup (Dashboard "Review" flow)
  if (!examId) {
    const [row] = await db
      .select()
      .from(userAttempts)
      .where(eq(userAttempts.id, attemptId))
      .limit(1);

    if (row) {
      attemptRow = row;
      examId = row.examId;
      userAnswers = (row.userAnswers ?? {}) as Record<string, unknown>;
    } else {
      // 最后回退到客户端 sessionStorage
      return <ResultClient attemptId={attemptId} />;
    }
  }

  // ── Fetch exam info ───────────────────────────────────────────
  const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
  if (!exam) notFound();

  // ── Fetch all questions for this exam ─────────────────────────
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId));

  if (rows.length === 0) notFound();
  rows.sort((a, b) => a.questionNumber - b.questionNumber);

  // ── Parse user answers from searchParams (only if not already loaded from DB)
  if (Object.keys(userAnswers).length === 0) {
    const answersRaw = typeof sp.answers === 'string' ? sp.answers : null;
    if (answersRaw) {
      try {
        userAnswers = JSON.parse(decodeURIComponent(answersRaw));
      } catch {
        // ignore
      }
    }
  }

  // ── Grade each question ───────────────────────────────────────
  let totalEarned = 0;
  let totalMax = 0;

  const questionResults: QuestionResult[] = rows.map((row) => {
    const qs = row.questionStructure as QS;
    const ua = userAnswers[row.id];
    const points = qs.points ?? 1;
    const { isCorrect, earned, correctDisplay } = gradeOne(qs, ua);

    totalEarned += earned;
    totalMax += points;

    return {
      questionId: row.id,
      questionNumber: row.questionNumber,
      type: qs.type,
      questionText: qs.questionText || '',
      instruction: qs.instruction || '',
      userAnswer: answerToDisplayString(ua),
      correctAnswer: correctDisplay,
      isCorrect,
      pointsEarned: earned,
      maxPoints: points,
      explanation: qs.explanation || '',
    };
  });

  const correctCount = questionResults.filter((r) => r.isCorrect).length;
  const module = rows[0]?.module ?? 'reading';
  const bandScore = calculateBandScore(totalEarned, totalMax, module as 'reading' | 'listening');

  const data: ExamResultData = {
    examName: exam.name,
    module,
    bandScore,
    bandLabel: bandScoreLabel(bandScore),
    bandColor: bandScoreColor(bandScore),
    rawScore: totalEarned,
    maxScore: totalMax,
    correctCount,
    totalCount: questionResults.length,
    accuracy: totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
    timeSpent: attemptRow?.startedAt && attemptRow?.completedAt
      ? (() => {
          const mins = Math.round((attemptRow.completedAt!.getTime() - attemptRow.startedAt!.getTime()) / 60000);
          return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
        })()
      : '',
    completedAt: new Date().toISOString(),
    questionResults,
  };

  return <ResultClient attemptId={attemptId} serverData={data} />;
}
