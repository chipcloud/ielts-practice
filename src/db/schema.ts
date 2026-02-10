import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  real,
  index,
  pgEnum,
  integer,
  text,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const examTypeEnum = pgEnum('exam_type', ['Academic', 'General']);
export const moduleEnum = pgEnum('module', ['listening', 'reading', 'writing', 'speaking']);
export const attemptStatusEnum = pgEnum('attempt_status', ['in_progress', 'completed']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Exams table (e.g., "Cambridge 15 Test 1")
export const exams = pgTable('exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: examTypeEnum('type').notNull().default('Academic'),
  isPublished: boolean('is_published').notNull().default(false),
  timeLimitMinutes: integer('time_limit_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  isPublishedIdx: index('exams_is_published_idx').on(table.isPublished),
}));

// Questions table
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  module: moduleEnum('module').notNull(),
  questionNumber: integer('question_number').notNull(),
  content: jsonb('content').notNull(), // Stores passage text, audio URL, or prompt
  questionStructure: jsonb('question_structure').notNull(), // Question types and correct answers
  maxScore: real('max_score').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  examIdIdx: index('questions_exam_id_idx').on(table.examId),
  moduleIdx: index('questions_module_idx').on(table.module),
}));

// User attempts table
export const userAttempts = pgTable('user_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  module: varchar('module', { length: 50 }).notNull(),
  userAnswers: jsonb('user_answers').notNull(), // Key-value pair of question_id: user_input
  score: real('score'),
  bandScore: real('band_score'),
  status: attemptStatusEnum('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_attempts_user_id_idx').on(table.userId),
  examIdIdx: index('user_attempts_exam_id_idx').on(table.examId),
  statusIdx: index('user_attempts_status_idx').on(table.status),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type UserAttempt = typeof userAttempts.$inferSelect;
export type NewUserAttempt = typeof userAttempts.$inferInsert;
