'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreTrendChart, type ScorePoint } from '@/components/dashboard/score-trend';
import { ModulePerformance, type ModuleScore } from '@/components/dashboard/module-performance';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface DashboardChartsProps {
  scoreTrendData: ScorePoint[];
  moduleScoreData: ModuleScore[];
}

export function DashboardCharts({ scoreTrendData, moduleScoreData }: DashboardChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Score Trend — 2/3 width on desktop */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('dashboard.scoreTrend')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t('dashboard.scoreTrendDesc')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <ScoreTrendChart data={scoreTrendData} />
        </CardContent>
      </Card>

      {/* Module Performance — 1/3 width on desktop */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('dashboard.byModule')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t('dashboard.byModuleDesc')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <ModulePerformance data={moduleScoreData} />
        </CardContent>
      </Card>
    </div>
  );
}
