export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * Fields in questionStructure that contain answers — must be stripped
 * before sending to the client to prevent cheating.
 */
const ANSWER_FIELDS = new Set([
  'correctAnswer',
  'alternativeAnswers',
  'correctPairs',
  'sampleAnswer',
]);

/**
 * Strip answer-related fields from a questionStructure object.
 * All other fields (type, instruction, options, gapText, premises, etc.) are passed through.
 */
function stripAnswers(structure: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(structure)) {
    if (!ANSWER_FIELDS.has(key)) {
      // For gap_fill: strip individual gap answers but keep gap ids
      if (key === 'gaps' && Array.isArray(value)) {
        safe[key] = value.map((gap: Record<string, unknown>) => ({
          id: gap.id,
          // Omit gap.answer and gap.alternatives
        }));
      } else {
        safe[key] = value;
      }
    }
  }
  return safe;
}

// GET /api/exams/[id] - Get exam details with questions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get exam
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, id),
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Get questions
    const examQuestions = await db.query.questions.findMany({
      where: eq(questions.examId, id),
      orderBy: [asc(questions.questionNumber)],
    });

    // Remove correct answers from response for security
    const questionsForClient = examQuestions.map((q) => ({
      id: q.id,
      examId: q.examId,
      module: q.module,
      questionNumber: q.questionNumber,
      content: q.content,
      maxScore: q.maxScore,
      createdAt: q.createdAt,
      questionStructure: stripAnswers(q.questionStructure as Record<string, unknown>),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...exam,
        questions: questionsForClient,
      },
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}
