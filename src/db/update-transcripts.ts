import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { questions, exams } from './schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon') ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

// ── Transcripts for each Listening Section ──────────────────────────
const SECTION_1_TRANSCRIPT = `Good morning, Office Supplies Direct. How can I help you?
Hi, I'd like to place an order please.
Of course. Can I have your company name please?
Yes, it's Rainbow Communications.
And the account number?
Six nine two four one one.
Thank you. And what would you like to order today?
Well, first I need two boxes of A4 paper, the standard white one.
Two boxes of A4, got it. Anything else?
Yes, I also need some white envelopes, the standard business size.
OK, white envelopes. And?
Ten packs of colored photocopy paper.
What color would you prefer? We have purple, light blue, and light green.
Light blue, please.
And I also need some floppy disks, the standard ones, let me see... three packs.
Three packs of floppy disks. Anything else?
Yes, wall calendars. We need six of those.
Six wall calendars. Is that everything?
Yes, that should do it.
Great. When would you like delivery?
Could it be tomorrow?
Tomorrow is Friday, so yes we can do that, but it would need to be after twelve noon. Would someone be available?
After twelve? Let me check... Actually, I won't be in after twelve tomorrow. Could you deliver before that?
I'm afraid the earliest would be lunchtime. What about Monday?
Monday would be fine. Let me give you the delivery address...`;

const SECTION_2_TRANSCRIPT = `Welcome to this week's film review. I'll be looking at three new releases for you.

First up is "The Kid Rides Again," a family-friendly western adventure. It's a charming enough story about a young boy who discovers his grandfather was once a famous cowboy. The acting is decent, the scenery is beautiful, but the plot is rather predictable. I'd say it's average but worth seeing if you like westerns. Give it a three out of five.

Next, we have "When You Find Love," a romantic comedy starring two of Hollywood's most bankable stars. I must say I was pleasantly surprised by this one. The chemistry between the leads is genuine, the dialogue is witty, and there are some genuinely touching moments. It's a good film, solid entertainment. Four out of five.

And finally, the one I've been most excited about: "Wronged." This is a prison drama about a man who was wrongly blamed for a crime that another person committed. He was sentenced to fifteen years in prison. While inside, a sympathetic prison guard helps him discover the truth about what really happened. Eventually, with the help of a friend on the outside, he fights to clear his name. The lead actor, Harrison, delivers an absolutely stunning performance. This is cinema at its finest. I would rate it excellent, a full five out of five.

"Wronged" stars Harrison in the lead role and will be released on March 15th. I cannot recommend it highly enough.`;

const SECTION_3_TRANSCRIPT = `Right, so, shall we start planning our research assignment?
Yes, good idea. The professor said we need to focus on climate change for this one.
Climate change, right. And when is it due?
She said next Friday, so we haven't got long.
OK. Did she say anything about sources?
Yes, she suggested using academic sources only, peer-reviewed journals and that sort of thing.
Makes sense. Where shall we meet to work on it? The lab is usually full.
How about the library? There's always space on the third floor.
Good thinking. Now, what about length? How many words?
She said three thousand words maximum.
Three thousand, that's quite a lot. I think we should include some statistics, maybe in chart form. That would really strengthen our argument.
That's a great idea. But we need to be careful about our sources. The professor specifically warned against using unreliable sources, like random websites with no references.
Absolutely. So how should we divide this up? I was thinking we could split it into three sections.
Three sections works for me. You could do the introduction and literature review, I'll do the methodology and data analysis, and then we can collaborate on the conclusion.
Sounds fair. And remember, the final draft needs to be reviewed by the tutor before submission.
Right, the tutor. We should book an appointment early next week then.`;

const SECTION_4_TRANSCRIPT = `Good afternoon everyone. Today's lecture will explore the fascinating history of architecture, from ancient times to the modern day.

Let's begin with the earliest known examples. The history of architecture dates back to around three thousand BC, when the first monumental structures were built in Mesopotamia and Egypt.

Speaking of Egypt, the most iconic structures are undoubtedly the pyramids. These magnificent structures were built as tombs for the pharaohs, designed to protect their bodies and treasures for the afterlife.

Moving to ancient Greece, we see the introduction of one of the most influential architectural elements: columns. The three Greek orders, Doric, Ionic, and Corinthian, established principles that are still used today.

The Romans took Greek ideas further. Roman engineers were particularly famous for building aqueducts, remarkable feats of engineering that transported water across vast distances to supply cities.

In the medieval period, Gothic architecture emerged across Europe. Gothic buildings are easily recognized by their pointed arches, ribbed vaults, and flying buttresses, which allowed for taller, more light-filled structures.

The Renaissance period, beginning in the fifteenth century, marked a return to classical ideals. Buildings of this era emphasized symmetry and mathematical proportion, drawing inspiration from ancient Rome.

Modern architecture, as we know it, began in the twentieth century. Architects like Le Corbusier and Frank Lloyd Wright rejected historical ornamentation in favour of clean lines and functional design.

Today, sustainable architecture is perhaps the most important development, with architects focusing on reducing the environmental impact of buildings through energy-efficient materials and design.

For those of you interested in seeing outstanding examples of architectural diversity, I would particularly recommend visiting Barcelona. The city offers everything from Gaudí's breathtaking organic forms to cutting-edge contemporary buildings.

Next week, we'll examine specific case studies. Thank you.`;

const TRANSCRIPTS: Record<string, string> = {
  'Section 1: Stationery Order': SECTION_1_TRANSCRIPT,
  'Section 2: Movie Reviews': SECTION_2_TRANSCRIPT,
  'Section 3: Academic Discussion': SECTION_3_TRANSCRIPT,
  'Section 4: Architecture Lecture': SECTION_4_TRANSCRIPT,
};

async function updateTranscripts() {
  console.log('🎙️ Updating listening questions with transcripts...');

  // Get all listening questions
  const listeningQs = await db.select()
    .from(questions)
    .where(eq(questions.module, 'listening'));

  let updated = 0;

  for (const q of listeningQs) {
    const content = q.content as any;
    const title = content?.title || '';

    // Find matching transcript
    const transcript = TRANSCRIPTS[title];
    if (transcript && !content.transcript) {
      await db.update(questions)
        .set({
          content: {
            ...content,
            transcript,
          },
        })
        .where(eq(questions.id, q.id));
      updated++;
    }
  }

  console.log(`✅ Updated ${updated} questions with transcripts.`);
  await pool.end();
}

updateTranscripts().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
