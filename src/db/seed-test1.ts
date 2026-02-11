import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { exams, questions } from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon') ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

async function seedTest1() {
  console.log('📖 Parsing and Seeding Practice Test 1 from PDF...');

  // 1. Create the Exam entries for different modules
  const [listeningExam] = await db.insert(exams).values({
    name: 'Practice Test 1 (Listening)',
    type: 'Academic',
    isPublished: true,
    timeLimitMinutes: 30,
  }).returning();

  const [readingExam] = await db.insert(exams).values({
    name: 'Practice Test 1 (Reading)',
    type: 'Academic',
    isPublished: true,
    timeLimitMinutes: 60,
  }).returning();

  console.log('✅ Created Practice Test 1 Exam entries');

  const questionsData: any[] = [];

  // ==========================================
  // 2. Listening Section 1 (Questions 1-10)
  // ==========================================
  
  const listeningSection1Qs = [
    { num: 1, text: 'THE NAME OF THE COMPANY:', type: 'gap_fill', ans: 'Rainbow Communications', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { num: 2, text: 'THE ACCOUNT NUMBER:', type: 'gap_fill', ans: '692411', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { num: 3, text: 'What would Jackson like to order? (box of A4)', type: 'gap_fill', ans: 'Two', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { num: 4, text: 'What would Jackson like to order? (envelopes)', type: 'gap_fill', ans: 'White', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { num: 5, text: 'What would Jackson like to order? (packs of colored photocopy paper)', type: 'gap_fill', ans: 'Ten', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { num: 6, text: 'What would Jackson like to order? (blank 6)', type: 'gap_fill', ans: 'Floppy disks', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { num: 7, text: 'What would Jackson like to order? (blank 7)', type: 'gap_fill', ans: 'Wall calendars', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.' },
    { 
      num: 8, 
      text: 'What color of the colored photocopy paper does the man order?', 
      type: 'multiple_choice', 
      ans: 'B', 
      instruction: 'Circle the correct letters from A-C.',
      options: [
        { id: 'A', text: 'Purple' },
        { id: 'B', text: 'Light blue' },
        { id: 'C', text: 'Light green' }
      ]
    },
    { 
      num: 9, 
      text: 'When would Jackson not be in the office?', 
      type: 'multiple_choice', 
      ans: 'C', 
      instruction: 'Circle the correct letters from A-C.',
      options: [
        { id: 'A', text: 'Before 11:30 a.m.' },
        { id: 'B', text: 'After 11:30 a.m.' },
        { id: 'C', text: 'After 12:00' }
      ]
    },
    { num: 10, text: 'What day is it tomorrow? Tomorrow is ____.', type: 'gap_fill', ans: 'Friday', instruction: 'Answer the following question. Write NO MORE THAN TWO WORDS for the answer.' },
  ];

  listeningSection1Qs.forEach(q => {
    questionsData.push({
      examId: listeningExam.id,
      module: 'listening',
      questionNumber: q.num,
      content: { audioUrl: '/audio/test1_section1.mp3' },
      maxScore: 1,
      questionStructure: {
        type: q.type,
        instruction: q.instruction,
        questionText: q.text,
        correctAnswer: q.ans,
        options: (q as any).options,
        points: 1,
      }
    });
  });

  // ==========================================
  // 3. Reading Passage 1 (Questions 1-14)
  // ==========================================
  
  const readingPassage1Text = `In a sense, the natural water reclamation process is billions of years old. Nature provides the "collection system" for us by precipitation, evaporation, and ground runoff. Nature's "treatment system" includes living organisms that purify waste material in the water of a river. These organisms settle to the bottom, and the particles are filtered from groundwater by trapping them in the rocks and sand as the water passes through.

In the last one hundred years, scientists and engineers have begun to understand some of the complex, delicate details of nature's process. During this time, populations have grown larger and more clustered. Production methods have become more effective, but have also placed greater demands on the water cycle. In response, scientists and engineers have found ways to refine and speed up nature's water reclamation processes. The streams, channels, ponds and reed beds that you will see on your walk through the park are all inter-connected. They form a complex and thriving wetland ecosystem. As the water moves through the systems it gains and loses nutrients, and is ultimately purified and recycled into the fish breeder and farming area. This is known as biofiltration—using nature to clean, filter and purify water.

Wetlands are one of the most important ecosystems on the earth today. They provide natural filters to purify water and serve as giant sponges, soaking up excess rainfall and releasing it slowly. This prevents floods and soil erosion. Wetlands also shelter thousands upon thousands of living things. These include plants like waterlillies, insects like dragonflies, fish, frogs and otters. Wetlands are an important breeding site for dragonflies, fish and frogs. All of these creatures need healthy, stable wetlands to breed and live in.`;

  const readingQs = [
    { num: 1, text: 'How does nature provide us the collection system in paragraph 1?', type: 'multiple_choice', ans: 'A', options: [
      { id: 'A', text: 'It provides us the collection system by precipitation, evaporation, and ground runoff.' },
      { id: 'B', text: 'It provides us the collection system only by precipitation, evaporation.' },
      { id: 'C', text: 'It provides us the collection system only by precipitation and ground runoff.' },
      { id: 'D', text: 'It provides us the collection system by evaporation, and ground runoff.' }
    ]},
    { num: 2, text: 'Which description is true about wetland?', type: 'multiple_choice', ans: 'D', options: [
      { id: 'A', text: 'Wetlands are only important ecosystems on the earth today.' },
      { id: 'B', text: 'Wetlands exposure thousands upon thousands of living things.' },
      { id: 'C', text: 'Wetlands are an important breeding site for dragonflies, fish and birds.' },
      { id: 'D', text: 'Wetlands provide natural filters to purify water and serve as giant sponges.' }
    ]},
    { num: 3, text: 'What does the writer say about wetland plants?', type: 'multiple_choice', ans: 'C', options: [
      { id: 'A', text: 'It has no capacity to remove toxic substances.' },
      { id: 'B', text: 'All wetland plants have been found to accumulate heavy metals in their tissues.' },
      { id: 'C', text: 'It has the capacity to remove toxic substances.' },
      { id: 'D', text: 'Wetland plants haven’t been found to accumulate heavy metals in their tissues.' }
    ]},
    { num: 4, text: 'Which number mentioned in the passage about environmental catastrophes associated with mining wastes is true?', type: 'multiple_choice', ans: 'D', options: [
      { id: 'A', text: 'Less than 5 million cubic metres of heavy metal-laden sludge poured into the Guadiamar river in 1999.' },
      { id: 'B', text: 'Only 5 million cubic metres of heavy metal-laden sludge poured into part of Coto Dona wetlands in 1999.' },
      { id: 'C', text: 'Less than 100,000 cubic metres of cyanide and heavy metal-contaminated wastewater flowed into three rivers.' },
      { id: 'D', text: '100,000 cubic metres of cyanide and heavy metal-contaminated wastewater devastated 1,000 km of river ecosystems in Romania.' }
    ]},
    { num: 5, text: 'What do we know about biofiltration system from the last paragraph?', type: 'multiple_choice', ans: 'A', options: [
      { id: 'A', text: 'Biofiltration system involves the water from the Fish Farm flowing into a lake where the hippos live.' },
      { id: 'B', text: 'Biofiltration system makes the water flow out of the Fish Farm into the ocean.' },
      { id: 'C', text: 'Biofiltration system makes the water flow out of a lake into the Fish Farm.' },
      { id: 'D', text: 'Biofiltration system makes the water flow from the Fish Farm flowing into a river.' }
    ]},
    // Summary completion (6-14)
    { num: 6, text: 'In a sense, the natural water 6. ________ is billions of years old.', type: 'gap_fill', ans: 'reclamation process' },
    { num: 7, text: '7. ________ have become more effective...', type: 'gap_fill', ans: 'Production methods' },
    { num: 8, text: 'Many wetland plants have the capacity to remove 8. ________...', type: 'gap_fill', ans: 'toxic substances' },
    { num: 9, text: '...from pesticides, 9. ________ and...', type: 'gap_fill', ans: 'industrial discharges' },
    { num: 10, text: '...and 10. ________.', type: 'gap_fill', ans: 'mining activities' },
    { num: 11, text: 'The value of the 11. ________ of wetlands is significant.', type: 'gap_fill', ans: 'purification function' },
    { num: 12, text: 'Of course, nature has 12. ________...', type: 'gap_fill', ans: 'its limitations' },
    { num: 13, text: '...and it would be wrong to consider that wetlands can 13. ________...', type: 'gap_fill', ans: 'deal with' },
    { num: 14, text: '...whatever 14. ________ we humans can produce.', type: 'gap_fill', ans: 'waste concentrations' },
  ];

  readingQs.forEach(q => {
    questionsData.push({
      examId: readingExam.id,
      module: 'reading',
      questionNumber: q.num,
      content: { 
        title: 'The Natural Water Reclamation',
        passage: readingPassage1Text 
      },
      maxScore: 1,
      questionStructure: {
        type: q.type,
        instruction: q.num <= 5 ? 'Circle the correct letters from A-D.' : 'Complete the summary. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        questionText: q.text,
        correctAnswer: q.ans,
        options: (q as any).options,
        points: 1,
      }
    });
  });

  console.log(`📡 Inserting ${questionsData.length} questions into database...`);
  
  // Batch insert
  for (let i = 0; i < questionsData.length; i += 10) {
    const chunk = questionsData.slice(i, i + 10);
    await db.insert(questions).values(chunk);
  }

  console.log('🎉 Practice Test 1 seeded successfully!');
  await pool.end();
}

seedTest1().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
