'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useExamStore, useStoreHydrated, type AnswerValue } from '@/lib/store/exam-store';
import { submitExam } from '@/actions/submit-exam';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { QuestionNavigation } from '@/components/exam/QuestionNavigation';
import { AudioPlayer } from '@/components/exam/AudioPlayer';
import { TTSPlayer } from '@/components/exam/TTSPlayer';
import { GapFillQuestion } from '@/components/exam/GapFillQuestion';
import { MatchingQuestion } from '@/components/exam/MatchingQuestion';
import { WritingEditor } from '@/components/exam/WritingEditor';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Flag, AlertCircle, Check, BookOpen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Question {
  id: string;
  examId: string;
  module: string;
  questionNumber: number;
  content: {
    passage?: string;
    title?: string;
    audioUrl?: string;
    transcript?: string;
    prompt?: string;
    [key: string]: unknown;
  };
  questionStructure: {
    type: string;
    instruction?: string;
    questionText?: string;
    options?: { id: string; text: string }[];
    gapText?: string;
    premises?: { id: string; text: string }[];
    minWords?: number;
    maxWords?: number;
    suggestedTimeMinutes?: number;
    [key: string]: unknown;
  };
  maxScore: number;
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function ExamSessionContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examName, setExamName] = useState('');

  // ── 等 persist 中间件从 sessionStorage 水合完成 ─────────────────
  const hydrated = useStoreHydrated();

  // ── Zustand store ─────────────────────────────────────────────────
  const {
    attemptId,
    examId: storeExamId,
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    status,
    initExam,
    setAnswer,
    toggleFlag,
    next,
    prev,
    goTo,
    complete,
    reset,
  } = useExamStore();

  const examId = searchParams.get('examId');
  const module = searchParams.get('module') || 'reading';

  // ── Load exam data（等水合完成后再执行）────────────────────────────
  useEffect(() => {
    if (!hydrated) return; // ⬅ 等待 sessionStorage 恢复完毕

    if (!examId) {
      router.push('/exams');
      return;
    }

    async function loadExam() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/exams/${examId}`);
        const data = await response.json();

        if (!data.success) {
          toast.error(t('examSession.loadError'));
          router.push('/exams');
          return;
        }

        const qs: Question[] = data.data.questions;
        setExamName(data.data.name);
        setQuestions(qs);

        // 读取水合后的最新 store 状态（不靠闭包里的旧值）
        const currentStore = useExamStore.getState();

        // 只在没有进行中的 session 或 examId 不匹配时才初始化
        const needsInit =
          !currentStore.attemptId ||
          currentStore.examId !== examId ||
          currentStore.status === 'completed';

        if (needsInit) {
          const attemptRes = await fetch('/api/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId, module }),
          });
          const attemptData = await attemptRes.json();

          if (attemptData.success) {
            initExam({
              examId: examId!,
              module,
              attemptId: attemptData.data.id,
              timeLimitMinutes: data.data.timeLimitMinutes || 60,
              totalQuestions: qs.length,
            });
          }
        } else {
          // 恢复了已有 session → 确保 timer 继续跑
          if (currentStore.status === 'in_progress' && !currentStore.isTimerRunning) {
            useExamStore.getState().resumeTimer();
          }
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        toast.error(t('examSession.loadError'));
      } finally {
        setIsLoading(false);
      }
    }

    loadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, module, hydrated]);

  // ── Submit handler (called manually or on time-up) ────────────────
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!auto && !confirm(t('examSession.submitConfirm'))) return;
      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        complete(); // mark store as completed & stop timer

        // Call Server Action — directly hits DB for grading
        const result = await submitExam(examId!, answers as Record<string, AnswerValue>, attemptId ?? undefined);

        if (result.success && result.data) {
          sessionStorage.setItem(
            `results-${attemptId}`,
            JSON.stringify({
              id: attemptId,
              status: 'completed',
              ...result.data,
            }),
          );
          toast.success(t('examSession.submitSuccess'));
          router.push(`/exam/result/${attemptId}`);
        } else {
          toast.error(result.error || t('examSession.submitError'));
        }
      } catch (err) {
        console.error('Submit error:', err);
        toast.error(t('examSession.submitError'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [examId, answers, attemptId, complete, router, t, isSubmitting],
  );

  // ── Time-up handler for ExamTimer ─────────────────────────────────
  const handleTimeUp = useCallback(() => {
    toast(t('examSession.timeUp', '时间到！正在自动交卷…'), { icon: '⏰' });
    handleSubmit(true);
  }, [handleSubmit, t]);

  // ── Leave handler ─────────────────────────────────────────────────
  const handleLeave = () => {
    if (confirm(t('examSession.leaveConfirm'))) {
      reset();
      router.push('/exams');
    }
  };

  // ── Loading state (包括水合等待) ──────────────────────────────────
  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{t('examSession.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];
  const isFlagged = flaggedQuestions.includes(currentQuestion?.id);
  const isWritingMode = module === 'writing' || currentQuestion?.questionStructure?.type === 'essay';

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between relative z-[60]">
        <div className="flex items-center gap-3">
          <Logo showLabel={false} />
          <div className="h-6 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleLeave}
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            {t('examSession.exit')}
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-semibold text-lg">{examName}</h1>
          <span className="text-sm text-muted-foreground capitalize">({module})</span>
        </div>
        <div className="flex items-center gap-3">
          <ExamTimer onTimeUp={handleTimeUp} />
          <LanguageSwitcher />
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {isWritingMode ? (
          /* ===== Writing Mode: full-width ===== */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-auto">
              {currentQuestion ? (
                <>
                  <div className="text-sm text-muted-foreground mb-2">
                    {t('examSession.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}
                    {currentQuestion.questionStructure.suggestedTimeMinutes && (
                      <span className="ml-3 text-xs bg-muted px-2 py-0.5 rounded">
                        {t('writing.suggestedTime', { min: currentQuestion.questionStructure.suggestedTimeMinutes })}
                      </span>
                    )}
                  </div>
                  <WritingEditor
                    value={(answers[currentQuestion.id] as string) || ''}
                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                    minWords={currentQuestion.questionStructure.minWords || 150}
                    prompt={currentQuestion.content.prompt}
                    className="h-[calc(100%-2rem)]"
                  />
                </>
              ) : (
                <div className="text-center text-muted-foreground mt-20">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('examSession.noQuestion')}</p>
                </div>
              )}
            </div>

            {/* Navigation for Writing */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
              <Button variant="outline" onClick={prev} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('examSession.previous')}
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button variant="default" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                  <Check className="h-4 w-4 mr-2" />
                  {isSubmitting ? t('examSession.submitting', '提交中…') : t('examSession.submit')}
                </Button>
              ) : (
                <Button onClick={next}>
                  {t('examSession.next')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* ===== Reading / Listening Mode: split-screen ===== */
          <>
            <div className="flex-1 flex">
              {/* Left: Passage / Audio */}
              <div className="w-1/2 border-r bg-background p-6 overflow-auto">
                {/* Audio: real file or TTS fallback */}
                {module === 'listening' && (
                  <div className="mb-6">
                    {currentQuestion?.content?.transcript ? (
                      <TTSPlayer
                        text={currentQuestion.content.transcript}
                        label={currentQuestion.content.title || 'Listening Audio'}
                      />
                    ) : currentQuestion?.content?.audioUrl?.startsWith('http') ? (
                      <AudioPlayer src={currentQuestion.content.audioUrl} />
                    ) : null}
                  </div>
                )}

                {currentQuestion?.content?.passage ? (
                  <div>
                    {currentQuestion.content.title && (
                      <h2 className="text-lg font-semibold mb-4">{currentQuestion.content.title}</h2>
                    )}
                    <div className="prose dark:prose-invert max-w-none">
                      {currentQuestion.content.passage.split('\n\n').map((para: string, idx: number) => (
                        <p key={idx} className="mb-4 leading-relaxed">{para}</p>
                      ))}
                    </div>
                  </div>
                ) : module !== 'listening' ? (
                  <div className="text-center text-muted-foreground mt-20">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('examSession.noPassage')}</p>
                  </div>
                ) : null}
              </div>

              {/* Right: Questions */}
              <div className="w-1/2 bg-muted/40 p-6 overflow-auto">
                {currentQuestion ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-6">
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('examSession.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {currentQuestion.questionStructure.instruction}
                        </p>
                        <h3 className="font-medium text-lg">
                          {currentQuestion.questionStructure.questionText}
                        </h3>
                      </div>

                      {/* Answer area — branch by question type */}
                      <div className="space-y-3">
                        {currentQuestion.questionStructure.gapText ? (
                          <GapFillQuestion
                            questionId={currentQuestion.id}
                            gapText={currentQuestion.questionStructure.gapText}
                            values={
                              typeof answers[currentQuestion.id] === 'object' && !Array.isArray(answers[currentQuestion.id])
                                ? (answers[currentQuestion.id] as Record<string, string>)
                                : {}
                            }
                            onChange={(gapId, value) => {
                              const prev =
                                typeof answers[currentQuestion.id] === 'object' && !Array.isArray(answers[currentQuestion.id])
                                  ? (answers[currentQuestion.id] as Record<string, string>)
                                  : {};
                              setAnswer(currentQuestion.id, { ...prev, [gapId]: value });
                            }}
                          />
                        ) : currentQuestion.questionStructure.premises && currentQuestion.questionStructure.options ? (
                          <MatchingQuestion
                            questionId={currentQuestion.id}
                            premises={currentQuestion.questionStructure.premises}
                            options={currentQuestion.questionStructure.options}
                            values={
                              typeof answers[currentQuestion.id] === 'object' && !Array.isArray(answers[currentQuestion.id])
                                ? (answers[currentQuestion.id] as Record<string, string>)
                                : {}
                            }
                            onChange={(premiseId, optionId) => {
                              const prev =
                                typeof answers[currentQuestion.id] === 'object' && !Array.isArray(answers[currentQuestion.id])
                                  ? (answers[currentQuestion.id] as Record<string, string>)
                                  : {};
                              setAnswer(currentQuestion.id, { ...prev, [premiseId]: optionId });
                            }}
                          />
                        ) : currentQuestion.questionStructure.options ? (
                          currentQuestion.questionStructure.options.map((option) => (
                            <label
                              key={option.id}
                              className={cn(
                                'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                                answers[currentQuestion.id] === option.id
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50',
                              )}
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={option.id}
                                checked={answers[currentQuestion.id] === option.id}
                                onChange={() => setAnswer(currentQuestion.id, option.id)}
                                className="sr-only"
                              />
                              <span className="font-medium">{option.id}.</span>
                              <span>{option.text}</span>
                            </label>
                          ))
                        ) : (
                          <input
                            type="text"
                            value={(answers[currentQuestion.id] as string) || ''}
                            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                            placeholder={t('examSession.answerPlaceholder')}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('examSession.noQuestion')}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <Button variant="outline" onClick={prev} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('examSession.previous')}
                  </Button>

                  <Button
                    variant={isFlagged ? 'secondary' : 'outline'}
                    onClick={() => toggleFlag(currentQuestion?.id)}
                  >
                    <Flag className={cn('h-4 w-4 mr-2', isFlagged && 'fill-current')} />
                    {isFlagged ? t('examSession.flagged') : t('examSession.flag')}
                  </Button>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button variant="default" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                      <Check className="h-4 w-4 mr-2" />
                      {isSubmitting ? t('examSession.submitting', '提交中…') : t('examSession.submit')}
                    </Button>
                  ) : (
                    <Button onClick={next}>
                      {t('examSession.next')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <QuestionNavigation questionIds={questions.map((q) => q.id)} />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense (useSearchParams requires it)
// ---------------------------------------------------------------------------

export default function ExamSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <ExamSessionContent />
    </Suspense>
  );
}
