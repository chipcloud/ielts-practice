'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ScorePoint {
  date: string;
  score: number;
}

interface ScoreTrendChartProps {
  data: ScorePoint[];
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 9]}
          ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
          }}
          labelStyle={{ fontWeight: 600, color: '#0f172a' }}
          formatter={(value) => [`Band ${Number(value ?? 0).toFixed(1)}`, 'Score']}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0f172a"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
