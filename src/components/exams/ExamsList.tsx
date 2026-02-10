'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import Link from 'next/link';

interface ExamItem {
  id: string;
  name: string;
  type: string;
  isPublished: boolean;
  timeLimitMinutes: number | null;
  questionCount: number;
  createdAt: Date | null;
}

/** Detect module from exam name (e.g. "... (Writing)" → "writing") */
function detectModule(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('writing')) return 'writing';
  if (lower.includes('listening')) return 'listening';
  if (lower.includes('speaking')) return 'speaking';
  return 'reading';
}

interface ExamsListProps {
  exams: ExamItem[];
}

function ExamCard({ exam }: { exam: ExamItem }) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{exam.name}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={exam.type === 'Academic' ? 'default' : 'secondary'}>
                  {exam.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {exam.questionCount} {t('exams.questions')}
                </span>
              </div>
            </CardDescription>
          </div>
          <div className="ml-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span>{exam.timeLimitMinutes || 60} {t('exams.timeLimit')}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/exam-session?examId=${exam.id}&module=${detectModule(exam.name)}`}>
              {t(`exams.start_${detectModule(exam.name)}`, t('exams.startButton'))}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExamCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="mt-2 h-4 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t('exams.noExamsTitle')}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {t('exams.noExamsDesc')}
      </p>
    </div>
  );
}

export function ExamsList({ exams }: ExamsListProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader />

      {/* Page Title */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-foreground">{t('exams.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('exams.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {exams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
