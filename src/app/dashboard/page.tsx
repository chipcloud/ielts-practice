export const runtime = 'edge';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { userAttempts, exams, questions } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { DashboardContent, type DashboardData } from './dashboard-content';

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ═══════════════════════════════════════════════════════════════════════
// Data Fetching (Server-side)
// ═══════════════════════════════════════════════════════════════════════

async function getDashboardData(userId: string) {
  const attempts = await db
    .select({
      id: userAttempts.id,
      examId: userAttempts.examId,
      module: userAttempts.module,
      score: userAttempts.score,
      bandScore: userAttempts.bandScore,
      status: userAttempts.status,
      startedAt: userAttempts.startedAt,
      completedAt: userAttempts.completedAt,
      examName: exams.name,
    })
    .from(userAttempts)
    .innerJoin(exams, eq(userAttempts.examId, exams.id))
    .where(eq(userAttempts.userId, userId))
    .orderBy(desc(userAttempts.createdAt));

  const completedAttempts = attempts.filter((a) => a.status === 'completed');

  // 总做题数
  let totalQuestions = 0;
  if (completedAttempts.length > 0) {
    const examIds = [...new Set(completedAttempts.map((a) => a.examId))];
    for (const eid of examIds) {
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(questions)
        .where(eq(questions.examId, eid));
      const attemptsForExam = completedAttempts.filter((a) => a.examId === eid);
      totalQuestions += (cnt ?? 0) * attemptsForExam.length;
    }
  }

  // 总练习时间（分钟）
  let totalMinutes = 0;
  for (const a of completedAttempts) {
    if (a.startedAt && a.completedAt) {
      totalMinutes += (a.completedAt.getTime() - a.startedAt.getTime()) / 60000;
    }
  }

  // 正确率
  const totalScore = completedAttempts.reduce((s, a) => s + (a.score ?? 0), 0);
  let totalMaxScore = 0;
  for (const a of completedAttempts) {
    const examQs = await db
      .select({ qs: questions.questionStructure })
      .from(questions)
      .where(eq(questions.examId, a.examId));
    const maxForExam = examQs.reduce((s, q) => {
      const pts = (q.qs as { points?: number })?.points ?? 1;
      return s + pts;
    }, 0);
    totalMaxScore += maxForExam;
  }
  const accuracy = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  // 最新 Band Score
  const latestBand = completedAttempts.length > 0
    ? completedAttempts[0].bandScore ?? 0
    : 0;

  // Score Trend（最近 7 次）
  const scoreTrend = completedAttempts
    .slice(0, 7)
    .reverse()
    .map((a) => ({
      date: a.completedAt
        ? a.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '',
      score: a.bandScore ?? 0,
    }));

  // Module Performance
  const moduleMap: Record<string, { total: number; count: number }> = {};
  for (const a of completedAttempts) {
    if (a.bandScore !== null) {
      if (!moduleMap[a.module]) moduleMap[a.module] = { total: 0, count: 0 };
      moduleMap[a.module].total += a.bandScore!;
      moduleMap[a.module].count += 1;
    }
  }
  const moduleOrder = ['reading', 'listening', 'writing', 'speaking'];
  const modulePerformance = moduleOrder
    .filter((m) => moduleMap[m])
    .map((m) => ({
      module: m.charAt(0).toUpperCase() + m.slice(1),
      score: Math.round((moduleMap[m].total / moduleMap[m].count) * 10) / 10,
    }));

  // Recent Activity（序列化 Date 为 string 传给客户端）
  const recentActivity = attempts.slice(0, 10).map((a) => ({
    id: a.id,
    examId: a.examId,
    examName: a.examName,
    module: a.module,
    score: a.score,
    bandScore: a.bandScore,
    status: a.status,
    startedAt: a.startedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
  }));

  return {
    stats: {
      bandScore: latestBand,
      practiceTime: formatDuration(totalMinutes),
      questionsSolved: totalQuestions,
      accuracy,
    },
    scoreTrend,
    modulePerformance,
    recentActivity,
    hasData: attempts.length > 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Server Component — data fetching only, delegates rendering to client
// ═══════════════════════════════════════════════════════════════════════

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id!;
  const userName = session.user.email?.split('@')[0] ?? 'User';
  const initials = userName.slice(0, 2).toUpperCase();

  const { stats, scoreTrend, modulePerformance, recentActivity, hasData } =
    await getDashboardData(userId);

  const data: DashboardData = {
    userName,
    initials,
    email: session.user.email ?? '',
    stats,
    scoreTrend,
    modulePerformance,
    recentActivity,
    hasData,
  };

  return <DashboardContent data={data} />;
}
