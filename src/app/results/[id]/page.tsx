'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useExamSession } from '@/store/examSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trophy,
  Target,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import Link from 'next/link';

interface QuestionResult {
  questionId: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
}

interface ExamResults {
  id: string;
  status: string;
  rawScore: number;
  maxScore: number;
  bandScore: number;
  questionResults: QuestionResult[];
  completedAt: string;
}

export default function ResultsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { reset } = useExamSession();
  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const attemptId = params.id as string;

  useEffect(() => {
    // Load results from sessionStorage
    const stored = sessionStorage.getItem(`results-${attemptId}`);
    if (stored) {
      try {
        setResults(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
    setIsLoading(false);
  }, [attemptId]);

  const handleRetake = () => {
    reset();
    router.push('/exams');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{t('results.loading')}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('results.notFound')}</h2>
          <p className="text-muted-foreground mb-6">{t('results.notFoundDesc')}</p>
          <Button asChild>
            <Link href="/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('results.backToExams')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const correctCount = results.questionResults.filter(r => r.isCorrect).length;
  const totalCount = results.questionResults.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // Band score color
  const getBandColor = (band: number) => {
    if (band >= 7.0) return 'text-green-600';
    if (band >= 5.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBandBg = (band: number) => {
    if (band >= 7.0) return 'bg-green-50 border-green-200';
    if (band >= 5.5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-background border-b relative z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo />
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold">{t('results.title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/exams">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('results.backToExams')}
                </Link>
              </Button>
              <Button onClick={handleRetake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('results.retake')}
              </Button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Band Score */}
          <Card className={cn('border-2', getBandBg(results.bandScore))}>
            <CardContent className="pt-6 text-center">
              <Trophy className={cn('h-10 w-10 mx-auto mb-3', getBandColor(results.bandScore))} />
              <div className={cn('text-5xl font-bold mb-1', getBandColor(results.bandScore))}>
                {results.bandScore.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">{t('results.bandScore')}</p>
            </CardContent>
          </Card>

          {/* Raw Score */}
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <div className="text-5xl font-bold text-blue-600 mb-1">
                {results.rawScore}/{results.maxScore}
              </div>
              <p className="text-sm text-muted-foreground">{t('results.rawScore')}</p>
            </CardContent>
          </Card>

          {/* Accuracy */}
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-purple-600" />
              <div className="text-5xl font-bold text-purple-600 mb-1">
                {percentage}%
              </div>
              <p className="text-sm text-muted-foreground">{t('results.accuracy')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {t('results.correctAnswers', { correct: correctCount, total: totalCount })}
              </span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-3">
              <div
                className={cn(
                  'h-3 rounded-full transition-all duration-500',
                  percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('results.questionDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.questionResults.map((result, index) => (
                <div
                  key={result.questionId}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    result.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {result.isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {t('results.questionNumber', { num: index + 1 })}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>{t('results.yourAnswer')}: </span>
                        <span className={cn(
                          'font-medium',
                          result.isCorrect ? 'text-green-700' : 'text-red-700'
                        )}>
                          {String(result.userAnswer) || t('results.noAnswer')}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div className="text-sm mt-0.5">
                          <span className="text-muted-foreground">{t('results.correctAnswer')}: </span>
                          <span className="font-medium text-green-700">
                            {String(result.correctAnswer)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.isCorrect ? 'default' : 'destructive'}>
                    {result.pointsEarned}/{result.maxPoints}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 pb-8">
          <Button variant="outline" asChild>
            <Link href="/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('results.backToExams')}
            </Link>
          </Button>
          <Button onClick={handleRetake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('results.retake')}
          </Button>
        </div>
      </main>
    </div>
  );
}
