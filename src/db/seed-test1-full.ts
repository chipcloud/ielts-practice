import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { exams, questions } from './schema';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon') ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

// ─── Passages ────────────────────────────────────────────────────────
const READING_PASSAGE_1 = `In a sense, the natural water reclamation process is billions of years old. Nature provides the "collection system" for us by precipitation, evaporation, and ground runoff. Nature's "treatment system" includes living organisms that purify waste material in the water of a river. These organisms settle to the bottom, and the particles are filtered from groundwater by trapping them in the rocks and sand as the water passes through.

In the last one hundred years, scientists and engineers have begun to understand some of the complex, delicate details of nature's process. During this time, populations have grown larger and more clustered. Production methods have become more effective, but have also placed greater demands on the water cycle. In response, scientists and engineers have found ways to refine and speed up nature's water reclamation processes. The streams, channels, ponds and reed beds that you will see on your walk through the park are all inter-connected. They form a complex and thriving wetland ecosystem. As the water moves through the systems it gains and loses nutrients, and is ultimately purified and recycled into the fish breeder and farming area. This is known as biofiltration—using nature to clean, filter and purify water.

Wetlands are one of the most important ecosystems on the earth today. They provide natural filters to purify water and serve as giant sponges, soaking up excess rainfall and releasing it slowly. This prevents floods and soil erosion. Wetlands also shelter thousands upon thousands of living things. These include plants like waterlillies, insects like dragonflies, fish, frogs and otters. Wetlands are an important breeding site for dragonflies, fish and frogs. All of these creatures need healthy, stable wetlands to breed and live in.

Wetland Plants have the capacity to remove toxic substances that come from pesticides, industrial discharges, and mining activities. A number of wetland plants have been found to accumulate heavy metals in their tissues. The value of the purification function of wetlands is significant.

Of course, nature has its limitations. And it would be wrong to consider that wetlands can deal with whatever waste concentrations we humans can produce. Environmental catastrophes associated with mining wastes are well known. In 1998, 5 million cubic metres of heavy metal-laden sludge poured into the Guadiamar river and part of Coto Doñana wetlands in Southern Spain. In 2000, 100,000 cubic metres of cyanide and heavy metal-contaminated wastewater devastated 1,000 km of river ecosystems in Romania.

In the biofiltration system of the park, the water from the Fish Farm flows into a lake where the hippos live. The water then flows through the Okavango Trail—a recreation of an African delta wetland habitat—before heading into a series of reedbeds and then the Main Lake.`;

const READING_PASSAGE_2 = `There are two main modes of interpretation: consecutive and simultaneous. Consecutive interpretation requires the speaker to stop after a few sentences and let the interpreter interpret the speaker's statement. In simultaneous interpretation (also known as UN-style interpretation) the interpreter, who uses interpreting equipment and works with another interpreter in a soundproof booth, listens to the speaker's speech in one language and simultaneously converts it into another language.

There are different models which scholars have proposed to describe the process of interpretation. Gile (1995) proposed a model called the Effort Model which concentrates on the limited capacity of processing information for simultaneous interpretation. Gile's model stresses the fact that simultaneous interpretation requires a great deal of mental energy and is very demanding. According to Gile, what makes simultaneous interpretation so difficult is that many processing capacity requirements come close to saturation and sometimes even exceed the interpreter's available capacity.

The model identifies some main efforts required to process information: the Listening and Analysis Effort which is the effort required to listen to the source speech and analyse the information. The second is the Production Effort, which is the effort required to produce an interpretation in the target language. The third effort is the Memory Effort, which is the effort required to store information in short-term memory before the interpreter is ready to interpret it. And finally, the fourth effort is the Coordination Effort, that is, the effort required to mentally coordinate all the other three efforts.

One of the biggest contributions of Gile's Effort Model is the specific link it establishes between the overall quality of an interpretation and the cognitive demands placed on the interpreter. If the cognitive demands placed on the interpreter become too great, the quality of the interpretation decreases. In fact, errors, omissions and inaccuracies are the result.

However, some criticisms have been made of the model. Setton (1999) argues that the model fails to account for the role of context. According to Setton, context can sometimes make the interpreter's job easier since the interpreter can predict what a speaker is about to say and doesn't have to depend solely on listening to the speech.`;

const READING_PASSAGE_3 = `The koala is a small bear-like, tree-dwelling, herbivorous marsupial which averages about 9kg in weight. Its fur is thick and usually ash grey with a tinge of brown in places. The koala gets its name from an ancient aboriginal word meaning "no drink" because it receives over 90% of its hydration from the eucalyptus leaves (also known as gum leaves) it eats, and only drinks when ill or when there is not enough moisture in the leaves. i.e. during droughts etc.

The koala is the only mammal, other than the Greater Glider and Ringtail Possum, which can survive on a diet of eucalyptus leaves. Eucalyptus leaves are very fibrous and low in nutrition, and to most animals are extremely poisonous. To cope with such a diet, nature has equipped koalas with specialised adaptations. A very slow metabolic rate allows koalas to retain food in their digestive system for a long period of time, maximising the amount of energy extracted. The koala's digestive system is especially adapted to detoxify the poisonous chemicals in the leaves. The cecum is greatly enlarged facilitating the microbial fermentation that detoxifies the chemicals.

The koala selects the leaves it eats. It has a good sense of smell and will select only the leaves that are not too poisonous. Koalas eat about 500g of leaves per day, spread over several feeding periods. They sleep for up to 20 hours a day in order to conserve energy.

Koalas are mostly nocturnal. They communicate with each other by making a range of noises, the most startling of which is a sound like a loud snore and then a belch. Breeding season for koalas is approximately August to February. This is a time of heightened activity, and� � can sometimes be heard calling to each other during this time. Females are generally mature at 2 years of age, and males at 3-4 years. Females can produce one young each year for about 12 years. Gestation is 35 days. Young remain hidden in the pouch for about 6 months, only opening the pouch to feed.

Koalas are not listed as an endangered species, but they are subject to increasing pressures from habitat loss. 80% of koala habitat has already been destroyed. Of the remaining 20%, almost none of it is protected and is privately owned. A number of conservation organizations have been established to address the issue. These groups are focused on public awareness and political lobbying, as well as direct conservation efforts such as planting new eucalyptus trees and protecting remaining habitat.`;

// ─── main function ──────────────────────────────────────────────────
async function seedFull() {
  console.log('🚀 Seeding Practice Test 1 (Complete: 82 questions)...\n');

  // ── Lookup / create exams ───────────────────────────────────────
  async function getOrCreate(name: string, minutes: number) {
    const [existing] = await db.select().from(exams).where(eq(exams.name, name)).limit(1);
    if (existing) {
      // 删掉旧题，重新灌入
      await db.delete(questions).where(eq(questions.examId, existing.id));
      console.log(`♻️  Cleared old questions for "${name}"`);
      return existing.id;
    }
    const [created] = await db.insert(exams).values({
      name, type: 'Academic', isPublished: true, timeLimitMinutes: minutes,
    }).returning();
    return created.id;
  }

  const listenId = await getOrCreate('Practice Test 1 (Listening)', 30);
  const readId   = await getOrCreate('Practice Test 1 (Reading)', 60);
  const writeId  = await getOrCreate('Practice Test 1 (Writing)', 60);

  const Q: any[] = [];

  // ================================================================
  //  LISTENING — 40 questions
  // ================================================================

  // ── Section 1 (1-10): Ordering stationery ─────────────────────
  const ls1 = [
    { n:1,  q:'The name of the company is ______.',            a:'Rainbow Communications' },
    { n:2,  q:'The account number is ______.',                  a:'692411' },
    { n:3,  q:'How many boxes of A4 paper? ______.',            a:'Two' },
    { n:4,  q:'What type of envelopes? ______.',                a:'White' },
    { n:5,  q:'How many packs of colored photocopy paper?',     a:'Ten' },
    { n:6,  q:'Item 6 to order: ______.',                       a:'Floppy disks' },
    { n:7,  q:'Item 7 to order: ______.',                       a:'Wall calendars' },
  ];
  ls1.forEach(x => Q.push({
    examId: listenId, module: 'listening', questionNumber: x.n,
    content: { audioUrl: '/audio/test1_section1.mp3', title: 'Section 1: Stationery Order' },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill', instruction: 'Complete the notes. Write NO MORE THAN THREE WORDS.',
      questionText: x.q,
      gapText: x.q.replace('______', '{{gap}}'), gaps: [{ id: 1, answer: x.a }], correctAnswer: [x.a], points: 1,
    },
  }));

  // MC questions 8-9
  Q.push({
    examId: listenId, module: 'listening', questionNumber: 8,
    content: { audioUrl: '/audio/test1_section1.mp3', title: 'Section 1: Stationery Order' },
    maxScore: 1,
    questionStructure: {
      type: 'multiple_choice',
      instruction: 'Choose the correct letter.',
      questionText: 'What color of the colored photocopy paper does the man order?',
      options: [
        { id: 'A', text: 'Purple' },
        { id: 'B', text: 'Light blue' },
        { id: 'C', text: 'Light green' },
      ],
      correctAnswer: 'B', points: 1,
    },
  });
  Q.push({
    examId: listenId, module: 'listening', questionNumber: 9,
    content: { audioUrl: '/audio/test1_section1.mp3', title: 'Section 1: Stationery Order' },
    maxScore: 1,
    questionStructure: {
      type: 'multiple_choice',
      instruction: 'Choose the correct letter.',
      questionText: 'When would Jackson not be in the office?',
      options: [
        { id: 'A', text: 'Before 11:30 a.m.' },
        { id: 'B', text: 'After 11:30 a.m.' },
        { id: 'C', text: 'After 12:00' },
      ],
      correctAnswer: 'C', points: 1,
    },
  });
  Q.push({
    examId: listenId, module: 'listening', questionNumber: 10,
    content: { audioUrl: '/audio/test1_section1.mp3', title: 'Section 1: Stationery Order' },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill', instruction: 'Write NO MORE THAN TWO WORDS.',
      questionText: 'What day is it tomorrow? Tomorrow is ______.',
      gapText: 'Tomorrow is {{gap}}.', gaps: [{ id: 1, answer: 'Friday' }],
      correctAnswer: ['Friday'], points: 1,
    },
  });

  // ── Section 2 (11-20): Movie Reviews ──────────────────────────
  const movieAssessments: [number, string][] = [
    [11, 'C'], // The Kid Rides Again → Average / worth seeing
    [12, 'D'], // When You Find Love → Good
    [13, 'B'], // Wronged → Excellent
  ];
  movieAssessments.forEach(([n, a]) => Q.push({
    examId: listenId, module: 'listening', questionNumber: n,
    content: { audioUrl: '/audio/test1_section2.mp3', title: 'Section 2: Movie Reviews' },
    maxScore: 1,
    questionStructure: {
      type: 'multiple_choice',
      instruction: 'What assessment does the author give? Choose A-E.',
      questionText: `Movie assessment for question ${n}`,
      options: [
        { id: 'A', text: 'Terrible' }, { id: 'B', text: 'Excellent' },
        { id: 'C', text: 'Average / worth seeing' }, { id: 'D', text: 'Good' },
        { id: 'E', text: 'Best this year' },
      ],
      correctAnswer: a, points: 1,
    },
  }));

  Q.push({
    examId: listenId, module: 'listening', questionNumber: 14,
    content: { audioUrl: '/audio/test1_section2.mp3', title: 'Section 2: Movie Reviews' },
    maxScore: 1,
    questionStructure: {
      type: 'multiple_choice',
      instruction: 'Choose the correct letter.',
      questionText: 'The hero of "Wronged" was sent to prison because:',
      options: [
        { id: 'A', text: 'He committed murder' },
        { id: 'B', text: 'He stole money' },
        { id: 'C', text: 'Another person committed a crime but he was wrongly blamed' },
      ],
      correctAnswer: 'C', points: 1,
    },
  });

  // Section 2 continued (15-20): fill-in
  const ls2fill = [
    { n: 15, q: 'The hero was sentenced to ______ years in prison.', a: '15' },
    { n: 16, q: 'A prison guard helps the hero discover ______ about the crime.', a: 'the truth' },
    { n: 17, q: 'The hero eventually escapes with the help of a ______.', a: 'friend' },
    { n: 18, q: '"Wronged" stars ______ in the lead role.', a: 'Harrison' },
    { n: 19, q: 'The film is rated ______ out of 5 stars.', a: '4' },
    { n: 20, q: 'The movie will be released on ______.', a: 'March 15' },
  ];
  ls2fill.forEach(x => Q.push({
    examId: listenId, module: 'listening', questionNumber: x.n,
    content: { audioUrl: '/audio/test1_section2.mp3', title: 'Section 2: Movie Reviews' },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill', instruction: 'Write NO MORE THAN THREE WORDS.',
      questionText: x.q,
      gapText: x.q.replace('______', '{{gap}}'),
      gaps: [{ id: 1, answer: x.a }], correctAnswer: [x.a], points: 1,
    },
  }));

  // ── Section 3 (21-30): Academic Discussion ────────────────────
  const ls3 = [
    { n: 21, q: 'The students are discussing their ______ assignment.', a: 'research' },
    { n: 22, q: 'The topic of the assignment is ______.', a: 'climate change' },
    { n: 23, q: 'They need to submit the assignment by ______.', a: 'next Friday' },
    { n: 24, q: 'The professor suggested using ______ sources.', a: 'academic' },
    { n: 25, q: 'They plan to meet in the ______ to work together.', a: 'library' },
    { n: 26, q: 'The word limit for the assignment is ______ words.', a: '3000' },
    { n: 27, q: 'One student suggests including ______ in chart form.', a: 'statistics' },
    { n: 28, q: 'The professor warns against using ______ sources.', a: 'unreliable' },
    { n: 29, q: 'They decide to divide the work into ______ sections.', a: 'three' },
    { n: 30, q: 'The final draft needs to be reviewed by the ______.', a: 'tutor' },
  ];
  ls3.forEach(x => Q.push({
    examId: listenId, module: 'listening', questionNumber: x.n,
    content: { audioUrl: '/audio/test1_section3.mp3', title: 'Section 3: Academic Discussion' },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill', instruction: 'Complete the notes. Write ONE WORD ONLY.',
      questionText: x.q,
      gapText: x.q.replace('______', '{{gap}}'),
      gaps: [{ id: 1, answer: x.a }], correctAnswer: [x.a], points: 1,
    },
  }));

  // ── Section 4 (31-40): Lecture ────────────────────────────────
  const ls4 = [
    { n: 31, q: 'The lecture is about the history of ______.', a: 'architecture' },
    { n: 32, q: 'The earliest examples date back to ______ BC.', a: '3000' },
    { n: 33, q: 'Egyptian pyramids were built as ______ for pharaohs.', a: 'tombs' },
    { n: 34, q: 'Greek architecture introduced the concept of ______.', a: 'columns' },
    { n: 35, q: 'Roman engineers were famous for building ______.', a: 'aqueducts' },
    { n: 36, q: 'Gothic architecture is recognized by its pointed ______.', a: 'arches' },
    { n: 37, q: 'The Renaissance period emphasized ______ and proportion.', a: 'symmetry' },
    { n: 38, q: 'Modern architecture began in the ______ century.', a: '20th' },
    { n: 39, q: 'Sustainable architecture focuses on ______ impact.', a: 'environmental' },
    { n: 40, q: 'The lecturer recommends visiting ______ for examples.', a: 'Barcelona' },
  ];
  ls4.forEach(x => Q.push({
    examId: listenId, module: 'listening', questionNumber: x.n,
    content: { audioUrl: '/audio/test1_section4.mp3', title: 'Section 4: Architecture Lecture' },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill', instruction: 'Complete the notes. Write ONE WORD AND/OR A NUMBER.',
      questionText: x.q,
      gapText: x.q.replace('______', '{{gap}}'),
      gaps: [{ id: 1, answer: x.a }], correctAnswer: [x.a], points: 1,
    },
  }));

  // ================================================================
  //  READING — 40 questions
  // ================================================================

  // ── Passage 1: Natural Water Reclamation (1-14) ───────────────
  // MC 1-5
  const rp1mc: [number, string, string, { id: string; text: string }[]][] = [
    [1, 'How does nature provide a collection system?', 'A', [
      { id: 'A', text: 'By precipitation, evaporation, and ground runoff' },
      { id: 'B', text: 'Only by precipitation and evaporation' },
      { id: 'C', text: 'Only by precipitation and ground runoff' },
      { id: 'D', text: 'By evaporation and ground runoff only' },
    ]],
    [2, 'Which description is true about wetlands?', 'D', [
      { id: 'A', text: 'Wetlands are the only important ecosystems on earth today' },
      { id: 'B', text: 'Wetlands expose thousands of living things to danger' },
      { id: 'C', text: 'Wetlands are an important breeding site for dragonflies, fish and birds' },
      { id: 'D', text: 'Wetlands provide natural filters to purify water and serve as giant sponges' },
    ]],
    [3, 'What does the writer say about wetland plants?', 'C', [
      { id: 'A', text: 'They have no capacity to remove toxic substances' },
      { id: 'B', text: 'All wetland plants accumulate heavy metals' },
      { id: 'C', text: 'They have the capacity to remove toxic substances' },
      { id: 'D', text: 'They have not been found to accumulate heavy metals' },
    ]],
    [4, 'Which statement about mining waste disasters is correct?', 'D', [
      { id: 'A', text: 'Less than 5 million cubic metres poured into the Guadiamar river in 1999' },
      { id: 'B', text: 'Only 5 million cubic metres poured into Coto Doñana wetlands in 1999' },
      { id: 'C', text: 'Less than 100,000 cubic metres of contaminated water flowed into rivers' },
      { id: 'D', text: '100,000 cubic metres of contaminated wastewater devastated 1,000 km of river ecosystems in Romania' },
    ]],
    [5, 'What do we know about the biofiltration system?', 'A', [
      { id: 'A', text: 'It involves water from the Fish Farm flowing into a lake where hippos live' },
      { id: 'B', text: 'It makes the water flow out of the Fish Farm into the ocean' },
      { id: 'C', text: 'It makes the water flow from a lake into the Fish Farm' },
      { id: 'D', text: 'It makes the water flow from the Fish Farm into a river' },
    ]],
  ];
  rp1mc.forEach(([n, q, a, opts]) => Q.push({
    examId: readId, module: 'reading', questionNumber: n,
    content: { title: 'The Natural Water Reclamation', passage: READING_PASSAGE_1 },
    maxScore: 1,
    questionStructure: {
      type: 'multiple_choice', instruction: 'Choose the correct letter A-D.',
      questionText: q, options: opts, correctAnswer: a, points: 1,
    },
  }));

  // Gap fill 6-14
  const rp1fill: [number, string, string][] = [
    [6,  'The natural water ______ process is billions of years old.', 'reclamation'],
    [7,  '______ methods have become more effective.', 'Production'],
    [8,  'Wetland plants can remove ______ substances.', 'toxic'],
    [9,  'Toxic substances come from pesticides, ______ discharges, and mining.', 'industrial'],
    [10, 'And ______ activities.', 'mining'],
    [11, 'The value of the ______ function of wetlands is significant.', 'purification'],
    [12, 'Of course, nature has its ______.', 'limitations'],
    [13, 'It would be wrong to consider wetlands can ______ with all waste.', 'deal'],
    [14, 'Whatever waste ______ we humans produce.', 'concentrations'],
  ];
  rp1fill.forEach(([n, q, a]) => Q.push({
    examId: readId, module: 'reading', questionNumber: n,
    content: { title: 'The Natural Water Reclamation', passage: READING_PASSAGE_1 },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill',
      instruction: 'Complete the summary. Choose ONE WORD ONLY from the passage.',
      questionText: q,
      gapText: q.replace('______', '{{gap}}'),
      gaps: [{ id: 1, answer: a }], correctAnswer: [a], points: 1,
    },
  }));

  // ── Passage 2: Interpretation (15-27) ─────────────────────────
  // MC 15-19
  const rp2mc: [number, string, string, { id: string; text: string }[]][] = [
    [15, 'In consecutive interpretation, the speaker must:', 'B', [
      { id: 'A', text: 'Speak continuously without stopping' },
      { id: 'B', text: 'Stop after a few sentences to let the interpreter translate' },
      { id: 'C', text: 'Speak in the target language' },
      { id: 'D', text: 'Work in a soundproof booth' },
    ]],
    [16, 'According to Gile, simultaneous interpretation is difficult because:', 'A', [
      { id: 'A', text: 'Processing capacity requirements come close to saturation' },
      { id: 'B', text: 'Interpreters do not have enough training' },
      { id: 'C', text: 'The equipment is unreliable' },
      { id: 'D', text: 'Speakers talk too fast' },
    ]],
    [17, 'How many main efforts does Gile identify?', 'C', [
      { id: 'A', text: 'Two' },
      { id: 'B', text: 'Three' },
      { id: 'C', text: 'Four' },
      { id: 'D', text: 'Five' },
    ]],
    [18, 'What happens when cognitive demands on the interpreter become too great?', 'B', [
      { id: 'A', text: 'The interpreter speaks louder' },
      { id: 'B', text: 'The quality of interpretation decreases' },
      { id: 'C', text: 'The interpreter requests a break' },
      { id: 'D', text: 'The booth equipment fails' },
    ]],
    [19, 'What criticism does Setton make of Gile\'s model?', 'A', [
      { id: 'A', text: 'It fails to account for the role of context' },
      { id: 'B', text: 'It is too complex' },
      { id: 'C', text: 'It only applies to consecutive interpretation' },
      { id: 'D', text: 'It ignores the Memory Effort' },
    ]],
  ];
  rp2mc.forEach(([n, q, a, opts]) => Q.push({
    examId: readId, module: 'reading', questionNumber: n,
    content: { title: 'Consecutive and Simultaneous Interpretation', passage: READING_PASSAGE_2 },
    maxScore: 1,
    questionStructure: {
      type: 'multiple_choice', instruction: 'Choose the correct letter A-D.',
      questionText: q, options: opts, correctAnswer: a, points: 1,
    },
  }));

  // Matching 20-23: Match the effort to its description
  Q.push({
    examId: readId, module: 'reading', questionNumber: 20,
    content: { title: 'Consecutive and Simultaneous Interpretation', passage: READING_PASSAGE_2 },
    maxScore: 1,
    questionStructure: {
      type: 'matching',
      instruction: 'Match each effort to its correct description.',
      questionText: 'Match the effort types identified by Gile.',
      premises: [
        { id: 'P1', text: 'Listening and Analysis Effort' },
        { id: 'P2', text: 'Production Effort' },
        { id: 'P3', text: 'Memory Effort' },
        { id: 'P4', text: 'Coordination Effort' },
      ],
      options: [
        { id: 'A', text: 'Effort to listen to source speech and analyse' },
        { id: 'B', text: 'Effort to produce interpretation in target language' },
        { id: 'C', text: 'Effort to store information in short-term memory' },
        { id: 'D', text: 'Effort to coordinate all other efforts' },
      ],
      correctPairs: { P1: 'A', P2: 'B', P3: 'C', P4: 'D' },
      points: 4,
    },
  });

  // TF 21-27
  const rp2tf: [number, string, string][] = [
    [21, 'Simultaneous interpretation is also known as UN-style interpretation.', 'TRUE'],
    [22, 'The interpreter works alone in the booth during simultaneous interpretation.', 'FALSE'],
    [23, 'Gile\'s model focuses on the unlimited capacity of the brain.', 'FALSE'],
    [24, 'Errors may result when cognitive demands exceed capacity.', 'TRUE'],
    [25, 'Setton agrees completely with Gile\'s model.', 'FALSE'],
    [26, 'Context can help interpreters predict what a speaker will say.', 'TRUE'],
    [27, 'Consecutive interpretation uses electronic equipment in booths.', 'FALSE'],
  ];
  rp2tf.forEach(([n, q, a]) => Q.push({
    examId: readId, module: 'reading', questionNumber: n,
    content: { title: 'Consecutive and Simultaneous Interpretation', passage: READING_PASSAGE_2 },
    maxScore: 1,
    questionStructure: {
      type: 'true_false_not_given',
      instruction: 'TRUE / FALSE / NOT GIVEN',
      questionText: q, correctAnswer: a, points: 1,
    },
  }));

  // ── Passage 3: Koala (28-40) ──────────────────────────────────
  const rp3tf: [number, string, string][] = [
    [28, 'The koala weighs exactly 9kg.', 'FALSE'],
    [29, 'The koala rarely drinks water.', 'TRUE'],
    [30, 'The koala is the only mammal that can survive on eucalyptus leaves.', 'FALSE'],
    [31, 'Eucalyptus leaves are nutritious and easy to digest.', 'FALSE'],
    [32, 'Koalas have a fast metabolic rate.', 'FALSE'],
    [33, 'The cecum helps detoxify poisonous chemicals.', 'TRUE'],
    [34, 'Koalas eat about 500g of leaves per day.', 'TRUE'],
  ];
  rp3tf.forEach(([n, q, a]) => Q.push({
    examId: readId, module: 'reading', questionNumber: n,
    content: { title: 'The Koala', passage: READING_PASSAGE_3 },
    maxScore: 1,
    questionStructure: {
      type: 'true_false_not_given',
      instruction: 'TRUE / FALSE / NOT GIVEN',
      questionText: q, correctAnswer: a, points: 1,
    },
  }));

  // Gap fill 35-40
  const rp3fill: [number, string, string][] = [
    [35, 'Koalas sleep for up to ______ hours a day.', '20'],
    [36, 'Koalas are mostly ______ animals.', 'nocturnal'],
    [37, 'Breeding season is approximately August to ______.', 'February'],
    [38, 'Females are generally mature at ______ years of age.', '2'],
    [39, '______ percent of koala habitat has already been destroyed.', '80'],
    [40, 'Conservation groups focus on ______ awareness and political lobbying.', 'public'],
  ];
  rp3fill.forEach(([n, q, a]) => Q.push({
    examId: readId, module: 'reading', questionNumber: n,
    content: { title: 'The Koala', passage: READING_PASSAGE_3 },
    maxScore: 1,
    questionStructure: {
      type: 'gap_fill',
      instruction: 'Complete the sentences. Write ONE WORD AND/OR A NUMBER.',
      questionText: q,
      gapText: q.replace('______', '{{gap}}'),
      gaps: [{ id: 1, answer: a }], correctAnswer: [a], points: 1,
    },
  }));

  // ================================================================
  //  WRITING — 2 questions
  // ================================================================

  Q.push({
    examId: writeId, module: 'writing', questionNumber: 1,
    content: {
      title: 'Writing Task 1',
      prompt: 'The chart below shows the percent of male-covered executive positions in ACME oil company within a one-year period between July 1993 and June 1994.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.',
    },
    maxScore: 9,
    questionStructure: {
      type: 'essay', minWords: 150, suggestedTimeMinutes: 20, points: 9,
    },
  });

  Q.push({
    examId: writeId, module: 'writing', questionNumber: 2,
    content: {
      title: 'Writing Task 2',
      prompt: 'Some people think that school children should learn to grow food and cook meals at school, while others believe this is not an important part of education.\n\nDiscuss both these views and give your own opinion.\n\nWrite at least 250 words.',
    },
    maxScore: 9,
    questionStructure: {
      type: 'essay', minWords: 250, suggestedTimeMinutes: 40, points: 9,
    },
  });

  // ================================================================
  //  INSERT ALL
  // ================================================================

  console.log(`\n📡 Total questions to insert: ${Q.length}`);

  const BATCH = 20;
  for (let i = 0; i < Q.length; i += BATCH) {
    await db.insert(questions).values(Q.slice(i, i + BATCH));
    console.log(`  ✅ Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(Q.length / BATCH)}`);
  }

  console.log(`\n🎉 Done! Inserted ${Q.length} questions across 3 exams.`);
  console.log(`   📖 Listening: 40 questions`);
  console.log(`   📖 Reading:   40 questions`);
  console.log(`   ✍️  Writing:   2 tasks`);

  await pool.end();
}

seedFull().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
