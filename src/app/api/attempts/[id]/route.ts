export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { gradeExam } from '@/lib/grading';

// PATCH /api/attempts/[id] - Submit answers and get grading results
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, answers, examId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // If submitting, perform auto-grading
    if (status === 'completed' && examId && answers) {
      // Fetch questions with correct answers from DB
      const examQuestions = await db.select().from(questions)
        .where(eq(questions.examId, examId));

      // Cast to the shape gradeExam expects
      const gradableQuestions = examQuestions.map(q => ({
        id: q.id,
        questionStructure: q.questionStructure as {
          type: string;
          correctAnswer?: string | string[];
          alternativeAnswers?: string[];
          caseSensitive?: boolean;
          points: number;
          gaps?: { id: number; answer: string; alternatives?: string[] }[];
          correctPairs?: Record<string, string>;
        },
      }));

      const { results, rawScore, maxScore, bandScore } = gradeExam(gradableQuestions, answers);

      // TODO: When auth is implemented, persist results to DB
      return NextResponse.json({
        success: true,
        data: {
          id,
          status: 'completed',
          rawScore,
          maxScore,
          bandScore,
          questionResults: results,
          completedAt: new Date().toISOString(),
        },
      });
    }

    // Non-grading update
    return NextResponse.json({
      success: true,
      data: {
        id,
        status: status || 'in_progress',
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Error updating attempt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attempt' },
      { status: 500 }
    );
  }
}

// GET /api/attempts/[id] - Get attempt details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: When auth is implemented, fetch from DB
    return NextResponse.json({
      success: true,
      data: {
        id,
        status: 'in_progress',
      },
    });
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}
