/**
 * IELTS Band Score 换算工具
 *
 * 基于官方 Academic Reading / Listening 评分标准
 * 原始分满分 40，映射到 Band 1–9
 */

// ---------------------------------------------------------------------------
// Academic Reading — Raw Score → Band Score
// ---------------------------------------------------------------------------

const ACADEMIC_READING_TABLE: [number, number][] = [
  [40, 9.0],
  [39, 8.5],
  [37, 8.0],
  [35, 7.5],
  [33, 7.0],
  [30, 6.5],
  [27, 6.0],
  [23, 5.5],
  [19, 5.0],
  [15, 4.5],
  [13, 4.0],
  [10, 3.5],
  [6, 3.0],
  [4, 2.5],
  [1, 2.0],
  [0, 0.0],
];

// ---------------------------------------------------------------------------
// Academic Listening — Raw Score → Band Score
// ---------------------------------------------------------------------------

const ACADEMIC_LISTENING_TABLE: [number, number][] = [
  [40, 9.0],
  [39, 8.5],
  [37, 8.0],
  [35, 7.5],
  [32, 7.0],
  [30, 6.5],
  [26, 6.0],
  [23, 5.5],
  [18, 5.0],
  [16, 4.5],
  [13, 4.0],
  [10, 3.5],
  [6, 3.0],
  [4, 2.5],
  [1, 2.0],
  [0, 0.0],
];

// ---------------------------------------------------------------------------
// General Training Reading — Raw Score → Band Score
// ---------------------------------------------------------------------------

const GENERAL_READING_TABLE: [number, number][] = [
  [40, 9.0],
  [39, 8.5],
  [38, 8.0],
  [36, 7.5],
  [34, 7.0],
  [32, 6.5],
  [30, 6.0],
  [27, 5.5],
  [23, 5.0],
  [19, 4.5],
  [15, 4.0],
  [12, 3.5],
  [8, 3.0],
  [5, 2.5],
  [1, 2.0],
  [0, 0.0],
];

// ---------------------------------------------------------------------------
// 对外 API
// ---------------------------------------------------------------------------

export type ScoringModule = 'reading' | 'listening';
export type ExamVariant = 'Academic' | 'General';

/**
 * 根据原始分和模块类型计算 Band Score
 *
 * @param rawScore   用户得分（0–40）
 * @param maxScore   满分（默认 40）
 * @param module     'reading' | 'listening'
 * @param variant    'Academic' | 'General'（仅 reading 有区别）
 */
export function calculateBandScore(
  rawScore: number,
  maxScore: number = 40,
  module: ScoringModule = 'reading',
  variant: ExamVariant = 'Academic',
): number {
  // 如果满分不是 40，先等比缩放到 40
  const scaled =
    maxScore === 40
      ? Math.round(rawScore)
      : Math.round((rawScore / Math.max(maxScore, 1)) * 40);

  const table = getTable(module, variant);

  for (const [minScore, band] of table) {
    if (scaled >= minScore) return band;
  }
  return 0;
}

/**
 * 获取对应换算表
 */
function getTable(
  module: ScoringModule,
  variant: ExamVariant,
): [number, number][] {
  if (module === 'listening') return ACADEMIC_LISTENING_TABLE;
  if (variant === 'General') return GENERAL_READING_TABLE;
  return ACADEMIC_READING_TABLE;
}

/**
 * Band Score 对应的描述性等级文本
 */
export function bandScoreLabel(band: number): string {
  if (band >= 9.0) return 'Expert';
  if (band >= 8.0) return 'Very Good';
  if (band >= 7.0) return 'Good';
  if (band >= 6.0) return 'Competent';
  if (band >= 5.0) return 'Modest';
  if (band >= 4.0) return 'Limited';
  return 'Extremely Limited';
}

/**
 * Band Score 对应的颜色 class
 */
export function bandScoreColor(band: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (band >= 7.0) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500/20' };
  if (band >= 5.5) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-500/20' };
}
