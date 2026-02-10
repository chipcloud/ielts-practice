'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamStore } from '@/lib/store/exam-store';
import { bandScoreLabel, bandScoreColor } from '@/lib/utils/scoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Trophy,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExamResultData, QuestionResult } from './page';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResultClientProps {
  attemptId: string;
  serverData?: ExamResultData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResultClient({ attemptId, serverData }: ResultClientProps) {
  const router = useRouter();
  const resetStore = useExamStore((s) => s.reset);
  const [data, setData] = useState<ExamResultData | null>(serverData ?? null);
  const [loading, setLoading] = useState(!serverData);

  // Fallback: load from sessionStorage (current no-auth flow)
  useEffect(() => {
    if (serverData) return;

    const stored = sessionStorage.getItem(`results-${attemptId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Map the old format into ExamResultData
        const qr: QuestionResult[] = (parsed.questionResults ?? []).map(
          (r: Record<string, unknown>, idx: number) => ({
            questionId: r.questionId ?? '',
            questionNumber: (r.questionNumber as number) ?? idx + 1,
            type: (r.type as string) ?? '',
            questionText: (r.questionText as string) ?? '',
            instruction: (r.instruction as string) ?? '',
            userAnswer: String(r.userAnswer ?? ''),
            correctAnswer: String(r.correctAnswer ?? ''),
            isCorrect: Boolean(r.isCorrect),
            pointsEarned: Number(r.pointsEarned ?? 0),
            maxPoints: Number(r.maxPoints ?? 1),
            explanation: (r.explanation as string) ?? '',
          }),
        );

        const correctCount = qr.filter((r) => r.isCorrect).length;
        const totalMax = Number(parsed.maxScore ?? qr.length);
        const rawScore = Number(parsed.rawScore ?? correctCount);
        const band = Number(parsed.bandScore ?? 0);

        setData({
          examName: (parsed.examName as string) ?? 'Exam Result',
          module: (parsed.module as string) ?? 'reading',
          bandScore: band,
          bandLabel: bandScoreLabel(band),
          bandColor: bandScoreColor(band),
          rawScore,
          maxScore: totalMax,
          correctCount,
          totalCount: qr.length,
          accuracy: totalMax > 0 ? Math.round((rawScore / totalMax) * 100) : 0,
          timeSpent: '',
          completedAt: (parsed.completedAt as string) ?? new Date().toISOString(),
          questionResults: qr,
        });
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, [attemptId, serverData]);

  const handleRetake = () => {
    resetStore();
    router.push('/exams');
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results…</p>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="text-center max-w-md px-4">
          <XCircle className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Results not found</h2>
          <p className="text-muted-foreground mb-6">
            The exam results you are looking for could not be found. They may have expired.
          </p>
          <Button asChild>
            <Link href="/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { bandScore, bandLabel, bandColor, rawScore, maxScore, correctCount, totalCount, accuracy, questionResults } = data;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/40">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition">
                <GraduationCap className="h-6 w-6" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-bold">Exam Results</h1>
                {data.examName && (
                  <p className="text-sm text-muted-foreground">{data.examName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/exams">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to Exams
                </Link>
              </Button>
              <Button size="sm" onClick={handleRetake}>
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Practice Again
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ═══════════════════════════════════════════════════════
            SECTION 1: Score Overview Card
           ═══════════════════════════════════════════════════════ */}
        <Card className={cn('border-2 overflow-hidden', bandColor.border)}>
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Left: Band Score */}
              <div className={cn(
                'flex flex-col items-center justify-center p-6 sm:p-8 md:w-1/3',
                bandColor.bg,
              )}>
                <Trophy className={cn('h-10 w-10 mb-2', bandColor.text)} />
                <div className={cn('text-6xl sm:text-7xl font-extrabold tracking-tight', bandColor.text)}>
                  {bandScore.toFixed(1)}
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-1">Band Score</div>
                <Badge className={cn('mt-2', bandColor.bg, bandColor.text, bandColor.border, 'border')}>
                  {bandLabel}
                </Badge>
              </div>

              {/* Right: Stats */}
              <div className="flex-1 p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                {/* Correct answers */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Correct Answers</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {correctCount}<span className="text-lg text-muted-foreground font-normal">/{totalCount}</span>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-muted-foreground">Accuracy</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{accuracy}%</div>
                </div>

                {/* Raw Score */}
                <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Raw Score</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {rawScore}<span className="text-lg text-muted-foreground font-normal">/{maxScore}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2: Answer Key Grid
           ═══════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Answer Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-13 lg:grid-cols-20 gap-1.5">
              {questionResults.map((r) => (
                <div
                  key={r.questionId}
                  title={`Q${r.questionNumber}: ${r.isCorrect ? 'Correct' : 'Incorrect'}`}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded-md text-xs font-semibold cursor-default transition-colors',
                    r.isCorrect
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200',
                  )}
                >
                  {r.questionNumber}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-emerald-100 border border-emerald-200" />
                Correct
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-red-100 border border-red-200" />
                Incorrect
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3: Detailed Review (Accordion)
           ═══════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detailed Review</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              {questionResults.map((r) => (
                <AccordionItem key={r.questionId} value={r.questionId}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left">
                      {r.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm sm:text-base">
                        Question {r.questionNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[11px] px-1.5 py-0',
                          r.isCorrect
                            ? 'border-emerald-300 text-emerald-700'
                            : 'border-red-300 text-red-700',
                        )}
                      >
                        {r.pointsEarned}/{r.maxPoints}
                      </Badge>
                      {r.type && (
                        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 hidden sm:inline-flex">
                          {formatType(r.type)}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="space-y-3 pl-8 pb-2">
                      {/* Question Text */}
                      {(r.questionText || r.instruction) && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Question Text
                          </div>
                          {r.instruction && (
                            <p className="text-sm text-muted-foreground italic mb-1">{r.instruction}</p>
                          )}
                          {r.questionText && (
                            <p className="text-sm text-foreground">{r.questionText}</p>
                          )}
                        </div>
                      )}

                      {/* Your Answer */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Your Answer
                        </div>
                        <p className={cn(
                          'text-sm',
                          r.isCorrect ? 'text-emerald-700' : 'text-red-700 font-bold',
                        )}>
                          {r.userAnswer || '(no answer)'}
                        </p>
                      </div>

                      {/* Correct Answer (only show when wrong) */}
                      {!r.isCorrect && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Correct Answer
                          </div>
                          <p className="text-sm text-emerald-700 font-medium">{r.correctAnswer}</p>
                        </div>
                      )}

                      {/* Explanation */}
                      {r.explanation && (
                        <div className="bg-muted/40 rounded-lg p-3">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Explanation
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{r.explanation}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* ── Bottom actions ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pb-8">
          <Button variant="outline" asChild>
            <Link href="/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Link>
          </Button>
          <Button onClick={handleRetake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Practice Again
          </Button>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatType(type: string): string {
  const map: Record<string, string> = {
    multiple_choice: 'MCQ',
    true_false_not_given: 'T/F/NG',
    yes_no_not_given: 'Y/N/NG',
    boolean: 'T/F/NG',
    gap_fill: 'Gap Fill',
    matching: 'Matching',
    essay: 'Essay',
    short_answer: 'Short Answer',
  };
  return map[type] ?? type.replace(/_/g, ' ');
}
