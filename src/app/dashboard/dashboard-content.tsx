'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SiteHeader } from '@/components/SiteHeader';
import {
  Trophy,
  Clock,
  CheckCircle2,
  Target,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Play,
  Inbox,
} from 'lucide-react';
import { DashboardCharts } from './dashboard-charts';

// ═══════════════════════════════════════════════════════════════════════
// Types — passed from server component
// ═══════════════════════════════════════════════════════════════════════

interface ActivityItem {
  id: string;
  examId: string;
  examName: string;
  module: string;
  score: number | null;
  bandScore: number | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DashboardData {
  userName: string;
  initials: string;
  email: string;
  stats: {
    bandScore: number;
    practiceTime: string;
    questionsSolved: number;
    accuracy: number;
  };
  scoreTrend: { date: string; score: number }[];
  modulePerformance: { module: string; score: number }[];
  recentActivity: ActivityItem[];
  hasData: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function getBandColor(band: number) {
  if (band >= 7.0) return 'text-emerald-600 dark:text-emerald-400';
  if (band >= 5.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Client Component
// ═══════════════════════════════════════════════════════════════════════

export function DashboardContent({ data }: { data: DashboardData }) {
  const { t } = useTranslation();
  const { userName, stats, scoreTrend, modulePerformance, recentActivity, hasData } = data;

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ═══════ A. Welcome Section ═══════ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('dashboard.welcomeBack', { name: userName })}
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasData ? t('dashboard.overviewText') : t('dashboard.emptyOverview')}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 shrink-0">
            <Link href="/exams">
              <Play className="h-4 w-4" />
              {t('dashboard.startPractice')}
            </Link>
          </Button>
        </div>

        {/* ═══════ B. Stats Grid ═══════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{t('dashboard.currentLevel')}</span>
              </div>
              <div className={`text-3xl font-extrabold ${hasData ? getBandColor(stats.bandScore) : 'text-muted-foreground/30'}`}>
                {hasData ? `Band ${stats.bandScore.toFixed(1)}` : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{t('dashboard.practiceTime')}</span>
              </div>
              <div className="text-3xl font-extrabold text-foreground">
                {hasData ? stats.practiceTime : '0m'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{t('dashboard.questionsSolved')}</span>
              </div>
              <div className="text-3xl font-extrabold text-foreground">
                {stats.questionsSolved}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{t('dashboard.accuracy')}</span>
              </div>
              <div className="text-3xl font-extrabold text-foreground mb-2">
                {hasData ? `${stats.accuracy}%` : '—'}
              </div>
              <Progress value={stats.accuracy} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* ═══════ C. Charts Section ═══════ */}
        {hasData && scoreTrend.length > 1 ? (
          <DashboardCharts
            scoreTrendData={scoreTrend}
            moduleScoreData={modulePerformance}
          />
        ) : !hasData ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-1">{t('dashboard.noDataTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('dashboard.noDataDesc')}
              </p>
              <Button asChild>
                <Link href="/exams">
                  <Play className="h-4 w-4 mr-2" />
                  {t('dashboard.takeFirstExam')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* ═══════ D. Recent Activity ═══════ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t('dashboard.recentActivity')}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" asChild>
                <Link href="/exams">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivity.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                {t('dashboard.noActivity')}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground">{t('dashboard.examName')}</th>
                        <th className="pb-3 font-medium text-muted-foreground">{t('dashboard.module')}</th>
                        <th className="pb-3 font-medium text-muted-foreground">{t('dashboard.date')}</th>
                        <th className="pb-3 font-medium text-muted-foreground">{t('dashboard.score')}</th>
                        <th className="pb-3 font-medium text-muted-foreground">{t('dashboard.status')}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">{t('dashboard.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((a) => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-3.5 font-medium text-foreground">{a.examName}</td>
                          <td className="py-3.5">
                            <Badge variant="secondary" className="font-normal capitalize">
                              {a.module}
                            </Badge>
                          </td>
                          <td className="py-3.5 text-muted-foreground">
                            {formatDate(a.status === 'completed' ? a.completedAt : a.startedAt)}
                          </td>
                          <td className="py-3.5">
                            {a.bandScore !== null && a.bandScore !== undefined ? (
                              <span className={`font-semibold ${getBandColor(a.bandScore)}`}>
                                Band {a.bandScore.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {a.score !== null && a.score !== undefined && (
                              <span className="text-xs text-muted-foreground ml-1.5">
                                ({a.score} pts)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {a.status === 'completed' ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                                {t('dashboard.completed')}
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950">
                                {t('dashboard.inProgress')}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            {a.status === 'completed' ? (
                              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                <Link href={`/exam/result/${a.id}`}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {t('dashboard.review')}
                                </Link>
                              </Button>
                            ) : (
                              <Button size="sm" className="gap-1.5" asChild>
                                <Link href={`/exam-session?examId=${a.examId}&module=${a.module}`}>
                                  <Play className="h-3.5 w-3.5" />
                                  {t('dashboard.continue')}
                                </Link>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {recentActivity.map((a) => (
                    <Link
                      key={a.id}
                      href={
                        a.status === 'completed'
                          ? `/exam/result/${a.id}`
                          : `/exam-session?examId=${a.examId}&module=${a.module}`
                      }
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {a.examName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[11px] px-1.5 py-0 capitalize">
                              {a.module}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(a.status === 'completed' ? a.completedAt : a.startedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          {a.bandScore !== null && a.bandScore !== undefined ? (
                            <span className={`text-sm font-semibold ${getBandColor(a.bandScore)}`}>
                              {a.bandScore.toFixed(1)}
                            </span>
                          ) : (
                            <Badge className={
                              a.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            }>
                              {a.status === 'completed' ? t('dashboard.done') : t('dashboard.inProgress')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
