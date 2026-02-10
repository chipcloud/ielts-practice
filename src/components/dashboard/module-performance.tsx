'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface ModuleScore {
  module: string;
  score: number;
}

interface ModulePerformanceProps {
  data: ModuleScore[];
}

const MODULE_COLORS: Record<string, string> = {
  Reading: '#0f172a',
  Listening: '#334155',
  Writing: '#64748b',
  Speaking: '#94a3b8',
};

export function ModulePerformance({ data }: ModulePerformanceProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="module"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 9]}
          ticks={[0, 3, 5, 7, 9]}
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
          formatter={(value) => [`Band ${Number(value ?? 0).toFixed(1)}`, 'Avg Score']}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
          {data.map((entry) => (
            <Cell
              key={entry.module}
              fill={MODULE_COLORS[entry.module] ?? '#64748b'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
