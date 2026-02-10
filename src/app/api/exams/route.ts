export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// GET /api/exams - List all published exams
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

    const conditions = [];

    if (!includeUnpublished) {
      conditions.push(eq(exams.isPublished, true));
    }

    if (type) {
      conditions.push(eq(exams.type, type as 'Academic' | 'General'));
    }

    // Use direct query instead of relational query
    const result = await db.select().from(exams)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(exams.createdAt));

    // Get question counts separately
    const examsWithCounts = await Promise.all(
      result.map(async (exam) => {
        const questionCount = await db.select({ count: questions.id }).from(questions)
          .where(eq(questions.examId, exam.id));
        return {
          ...exam,
          questionCount: questionCount.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: examsWithCounts });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create a new exam (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, timeLimitMinutes, questions: examQuestions } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create exam
    const [exam] = await db.insert(exams).values({
      name,
      type,
      timeLimitMinutes,
      isPublished: false,
    }).returning();

    // Create questions if provided
    if (examQuestions && examQuestions.length > 0) {
      const questionsToInsert = examQuestions.map((q: any, index: number) => ({
        examId: exam.id,
        module: q.module,
        questionNumber: index + 1,
        content: q.content,
        questionStructure: q.questionStructure,
        maxScore: q.maxScore || 1,
      }));

      await db.insert(questions).values(questionsToInsert);
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}
