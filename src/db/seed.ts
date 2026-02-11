import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { exams, questions, users } from './schema';
import { hash } from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/ielts_practice',
  ssl: process.env.DATABASE_URL?.includes('neon') ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing data (safe for dev)
  await db.delete(questions);
  await db.delete(exams);
  console.log('🧹 Cleaned existing exam data.');

  // 2. Create Admin User
  const adminPassword = await hash('admin123', 10);
  const [admin] = await db
    .insert(users)
    .values({
      email: 'admin@ielts-practice.com',
      passwordHash: adminPassword,
      role: 'admin',
    })
    .onConflictDoNothing() // Prevent error if running seed twice
    .returning();
  
  if (admin) console.log('👤 Admin user created/verified:', admin.email);

  // ==========================================
  // 3. Create Reading Exam (Cambridge 15)
  // ==========================================
  const [readingExam] = await db
    .insert(exams)
    .values({
      name: 'Cambridge IELTS 15 - Test 1 (Reading)',
      type: 'Academic',
      isPublished: true,
      timeLimitMinutes: 60,
    })
    .returning();
  console.log('📖 Created Reading Exam:', readingExam.name);

  // Shared Passage Content (to reuse across questions)
  const passageContent = {
    title: 'The Nature of Intelligence',
    source: 'Cambridge IELTS 15',
    passage: `The concept of intelligence has been debated for centuries. While early theories focused on a single general intelligence factor (g), modern research has revealed a more complex picture. Howard Gardner's theory of multiple intelligences, proposed in 1983, suggests that intelligence is not a single entity but rather a set of distinct abilities.\n\nCritics, however, argue that these "intelligences" are merely talents or personality traits. Sternberg's triarchic theory offers a middle ground, identifying analytical, creative, and practical intelligence. Recent studies in neuroscience have also begun to map these functions to specific brain regions, suggesting a biological basis for diverse cognitive strengths.`,
    wordCount: 220,
  };

  const readingQuestionsData = [
    // --- Type A: True / False / Not Given ---
    {
      examId: readingExam.id,
      module: 'reading',
      questionNumber: 1,
      content: passageContent,
      maxScore: 1,
      questionStructure: {
        type: 'true_false_not_given',
        instruction: 'Do the following statements agree with the information given in the passage?',
        questionText: "Howard Gardner's theory proposes that intelligence consists of multiple distinct abilities.",
        options: [
          { id: 'TRUE', text: 'TRUE' },
          { id: 'FALSE', text: 'FALSE' },
          { id: 'NOT_GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'TRUE',
        alternativeAnswers: ['True', 'T'],
        points: 1,
      },
    },
    // --- Type B: Single Choice ---
    {
      examId: readingExam.id,
      module: 'reading',
      questionNumber: 2,
      content: { ...passageContent, passage: 'See above passage' }, // Front-end optimization: don't re-render full text
      maxScore: 1,
      questionStructure: {
        type: 'multiple_choice',
        instruction: 'Choose the correct letter, A, B, C or D.',
        questionText: 'According to Gardner, which of the following is NOT one of the original seven intelligences?',
        options: [
            { id: 'A', text: 'Linguistic intelligence' },
            { id: 'B', text: 'Naturalistic intelligence' }, // Correct: Naturalistic was added later
            { id: 'C', text: 'Spatial intelligence' },
            { id: 'D', text: 'Musical intelligence' },
        ],
        correctAnswer: 'B',
        points: 1,
      },
    },
    // --- Type C: Summary Completion (Gap Fill) ---
    {
      examId: readingExam.id,
      module: 'reading',
      questionNumber: 3,
      content: { ...passageContent, passage: 'See above passage' },
      maxScore: 1,
      questionStructure: {
        type: 'gap_fill',
        instruction: 'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
        questionText: 'Complete the summary.',
        // Using {{gap}} as a placeholder for frontend inline inputs
        gapText: "While early theories emphasized a single factor known as {{gap}}, later research introduced more complexity. Sternberg's theory, for instance, identifies three types of intelligence: analytical, creative, and {{gap}}.",
        gaps: [
            { id: 1, answer: 'g', alternatives: ['(g)'] },
            { id: 2, answer: 'practical', alternatives: [] }
        ],
        correctAnswer: ['g', 'practical'],
        points: 2,
      },
    },
    // --- Type D: Matching Headings ---
    {
      examId: readingExam.id,
      module: 'reading',
      questionNumber: 4,
      content: { ...passageContent, passage: 'See above passage' },
      maxScore: 1,
      questionStructure: {
        type: 'matching',
        instruction: 'Match the correct theory with its proponent.',
        questionText: 'Match each theory to the person who proposed it.',
        premises: [
            { id: 'P1', text: 'Multiple Intelligences Theory' },
            { id: 'P2', text: 'Triarchic Theory' }
        ],
        options: [
            { id: 'A', text: 'Howard Gardner' },
            { id: 'B', text: 'Robert Sternberg' },
            { id: 'C', text: 'Sigmund Freud' } // Distractor
        ],
        correctPairs: { 'P1': 'A', 'P2': 'B' },
        points: 2,
      },
    }
  ];

  // Insert Reading Questions
  for (const q of readingQuestionsData) {
    await db.insert(questions).values(q as any); // Cast as any if TS schema is strict on JSON
  }
  console.log(`✅ Seeded ${readingQuestionsData.length} Reading questions.`);


  // ==========================================
  // 4. Create Writing Exam (Task 1 & 2)
  // ==========================================
  const [writingExam] = await db
    .insert(exams)
    .values({
      name: 'Cambridge IELTS 15 - Test 1 (Writing)',
      type: 'Academic',
      isPublished: true,
      timeLimitMinutes: 60,
    })
    .returning();
  console.log('✍️ Created Writing Exam:', writingExam.name);

  const writingQuestionsData = [
    // --- Task 1: Chart/Graph ---
    {
      examId: writingExam.id,
      module: 'writing',
      questionNumber: 1,
      content: {
        title: 'Writing Task 1',
        imageUrl: '/images/charts/coffee_production_2024.png', // Placeholder URL
        prompt: 'The chart below shows the production of coffee in three different countries from 1990 to 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      },
      maxScore: 9, // Band score
      questionStructure: {
        type: 'essay',
        minWords: 150,
        suggestedTimeMinutes: 20,
        sampleAnswer: 'The bar chart illustrates...',
        points: 9,
      },
    },
    // --- Task 2: Argumentative Essay ---
    {
      examId: writingExam.id,
      module: 'writing',
      questionNumber: 2,
      content: {
        title: 'Writing Task 2',
        prompt: 'Some people believe that the best way to solve environmental problems is to increase the price of fuel. To what extent do you agree or disagree?',
      },
      maxScore: 9,
      questionStructure: {
        type: 'essay',
        minWords: 250,
        suggestedTimeMinutes: 40,
        sampleAnswer: 'Environmental issues are becoming increasingly pressing...',
        points: 9,
      },
    }
  ];

  // Insert Writing Questions
  for (const q of writingQuestionsData) {
    await db.insert(questions).values(q as any);
  }
  console.log(`✅ Seeded ${writingQuestionsData.length} Writing questions.`);

  console.log('🎉 Seeding completed successfully!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});