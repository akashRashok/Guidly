import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Users table (teachers only)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// NextAuth accounts table
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// NextAuth sessions table
export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// NextAuth verification tokens table
export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// Assignments table
export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  linkSlug: text("link_slug").notNull().unique(),
  classCode: text("class_code").notNull(),
  isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Questions table
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  questionType: text("question_type").notNull().default("short_answer"), // short_answer, multiple_choice
  options: text("options"), // JSON array for multiple choice
  order: integer("order").notNull(),
});

// Misconceptions table (predefined categories)
export const misconceptions = sqliteTable("misconceptions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  teachingSuggestion: text("teaching_suggestion"),
});

// Question-Misconception mappings
export const questionMisconceptions = sqliteTable("question_misconceptions", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  misconceptionId: text("misconception_id")
    .notNull()
    .references(() => misconceptions.id, { onDelete: "cascade" }),
  wrongAnswerPattern: text("wrong_answer_pattern").notNull(), // regex or exact match
  explanation: text("explanation"), // static explanation if available
  followUpQuestion: text("follow_up_question"),
  followUpAnswer: text("follow_up_answer"),
});

// Student sessions (identity per assignment)
export const studentSessions = sqliteTable("student_sessions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  studentName: text("student_name").notNull(),
  classCode: text("class_code").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Student responses
export const studentResponses = sqliteTable("student_responses", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => studentSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  misconceptionId: text("misconception_id").references(() => misconceptions.id),
  aiExplanation: text("ai_explanation"), // Generated on-the-fly, not stored permanently
  followUpAnswer: text("follow_up_answer"),
  followUpCorrect: integer("follow_up_correct", { mode: "boolean" }),
  answeredAt: integer("answered_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Misconception = typeof misconceptions.$inferSelect;
export type NewMisconception = typeof misconceptions.$inferInsert;
export type QuestionMisconception = typeof questionMisconceptions.$inferSelect;
export type StudentSession = typeof studentSessions.$inferSelect;
export type NewStudentSession = typeof studentSessions.$inferInsert;
export type StudentResponse = typeof studentResponses.$inferSelect;
export type NewStudentResponse = typeof studentResponses.$inferInsert;

