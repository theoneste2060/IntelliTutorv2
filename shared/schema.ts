import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: integer("expire").notNull(),
});

// User storage table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("student"), // student, admin
  currentLevel: text("current_level").default("Beginner"),
  totalScore: integer("total_score").default(0),
  questionsCompleted: integer("questions_completed").default(0),
  studyStreak: integer("study_streak").default(0),
  lastActiveDate: integer("last_active_date"),
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

// Exam papers uploaded by admins
export const examPapers = sqliteTable("exam_papers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  year: integer("year").notNull(),
  level: text("level").notNull(), // O-Level, A-Level
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").default("processing"), // processing, completed, failed
  totalQuestions: integer("total_questions").default(0),
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: integer("created_at").default(Date.now()),
});

// Individual questions extracted from exam papers
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examPaperId: integer("exam_paper_id").references(() => examPapers.id),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  learningOutcome: text("learning_outcome"),
  aiModelAnswer: text("ai_model_answer"),
  aiConfidence: real("ai_confidence").default(0),
  isVerified: integer("is_verified", { mode: 'boolean' }).default(false),
  verifiedBy: text("verified_by").references(() => users.id),
  createdAt: integer("created_at").default(Date.now()),
});

// Student answers and evaluations
export const studentAnswers = sqliteTable("student_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: text("student_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  answerText: text("answer_text").notNull(),
  score: real("score").notNull(), // 0-100
  feedback: text("feedback"),
  evaluationDetails: text("evaluation_details"), // JSON string instead of jsonb
  timeSpent: integer("time_spent"), // seconds
  attempts: integer("attempts").default(1),
  isCorrect: integer("is_correct", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at").default(Date.now()),
});

// Badges and achievements
export const badges = sqliteTable("badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // FontAwesome icon class
  color: text("color"), // CSS color for gradient
  criteria: text("criteria"), // JSON string for conditions to earn badge
  createdAt: integer("created_at").default(Date.now()),
});

// User badge achievements
export const userBadges = sqliteTable("user_badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  badgeId: integer("badge_id").references(() => badges.id),
  earnedAt: integer("earned_at").default(Date.now()),
});

// Study sessions for progress tracking
export const studySessions = sqliteTable("study_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: text("student_id").references(() => users.id),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time"),
  questionsAttempted: integer("questions_attempted").default(0),
  correctAnswers: integer("correct_answers").default(0),
  totalScore: real("total_score").default(0),
  avgTimePerQuestion: real("avg_time_per_question"),
  createdAt: integer("created_at").default(Date.now()),
});

// Admin users for credential-based login
export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").unique().notNull(),
  password: text("password").notNull(), // hashed password
  email: text("email"),
  createdAt: integer("created_at").default(Date.now()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  examPapers: many(examPapers),
  studentAnswers: many(studentAnswers),
  userBadges: many(userBadges),
  studySessions: many(studySessions),
}));

export const examPapersRelations = relations(examPapers, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [examPapers.uploadedBy],
    references: [users.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  examPaper: one(examPapers, {
    fields: [questions.examPaperId],
    references: [examPapers.id],
  }),
  verifiedBy: one(users, {
    fields: [questions.verifiedBy],
    references: [users.id],
  }),
  studentAnswers: many(studentAnswers),
}));

export const studentAnswersRelations = relations(studentAnswers, ({ one }) => ({
  student: one(users, {
    fields: [studentAnswers.studentId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [studentAnswers.questionId],
    references: [questions.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  student: one(users, {
    fields: [studySessions.studentId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertExamPaperSchema = createInsertSchema(examPapers);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertStudentAnswerSchema = createInsertSchema(studentAnswers);
export const insertBadgeSchema = createInsertSchema(badges);
export const insertUserBadgeSchema = createInsertSchema(userBadges);
export const insertStudySessionSchema = createInsertSchema(studySessions);
export const insertAdminUserSchema = createInsertSchema(adminUsers);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type ExamPaper = typeof examPapers.$inferSelect;
export type InsertExamPaper = typeof examPapers.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = typeof studentAnswers.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;