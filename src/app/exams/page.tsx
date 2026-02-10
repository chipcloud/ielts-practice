export const runtime = 'edge';
import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ExamsList } from '@/components/exams/ExamsList';

async function getExams() {
  // Get all published exams
  const examsList = await db.select().from(exams)
    .where(eq(exams.isPublished, true))
    .orderBy(desc(exams.createdAt));

  // Get question counts for each exam
  const examsWithCounts = await Promise.all(
    examsList.map(async (exam) => {
      const questionList = await db.select({ id: questions.id })
        .from(questions)
        .where(eq(questions.examId, exam.id));

      return {
        ...exam,
        questionCount: questionList.length,
      };
    })
  );

  return examsWithCounts;
}

export default async function ExamsPage() {
  const examsList = await getExams();

  return <ExamsList exams={examsList} />;
}
