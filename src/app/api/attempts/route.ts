export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { userAttempts } from '@/db/schema';

// POST /api/attempts — 创建考试 attempt 并持久化到 DB
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { examId, module } = body;

    if (!examId || !module) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: examId and module' },
        { status: 400 },
      );
    }

    // 如果已登录，持久化到 user_attempts 表
    if (session?.user?.id) {
      const [attempt] = await db
        .insert(userAttempts)
        .values({
          userId: session.user.id,
          examId,
          module,
          userAnswers: {},
          status: 'in_progress',
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: {
          id: attempt.id,
          examId,
          module,
          status: 'in_progress',
          startedAt: attempt.startedAt?.toISOString(),
        },
      });
    }

    // 未登录：仍然生成临时 ID（向下兼容）
    const { randomUUID } = await import('crypto');
    return NextResponse.json({
      success: true,
      data: {
        id: randomUUID(),
        examId,
        module,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attempt' },
      { status: 500 },
    );
  }
}
