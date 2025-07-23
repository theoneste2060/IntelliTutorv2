import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // student, admin
  currentLevel: varchar("current_level").default("Beginner"),
  totalScore: integer("total_score").default(0),
  questionsCompleted: integer("questions_completed").default(0),
  studyStreak: integer("study_streak").default(0),
  lastActiveDate: timestamp("last_active_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam papers uploaded by admins
export const examPapers = pgTable("exam_papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: varchar("subject").notNull(),
  year: integer("year").notNull(),
  level: varchar("level").notNull(), // O-Level, A-Level
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: varchar("status").default("processing"), // processing, completed, failed
  totalQuestions: integer("total_questions").default(0),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual questions extracted from exam papers
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examPaperId: integer("exam_paper_id").references(() => examPapers.id),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  subject: varchar("subject").notNull(),
  topic: varchar("topic"),
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  learningOutcome: text("learning_outcome"),
  aiModelAnswer: text("ai_model_answer"),
  aiConfidence: real("ai_confidence").default(0),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student answers and evaluations
export const studentAnswers = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  answerText: text("answer_text").notNull(),
  score: real("score").notNull(), // 0-100
  feedback: text("feedback"),
  evaluationDetails: jsonb("evaluation_details"), // TF-IDF, grammar scores etc
  timeSpent: integer("time_spent"), // seconds
  attempts: integer("attempts").default(1),
  isCorrect: boolean("is_correct").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Badges and achievements
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"), // FontAwesome icon class
  color: varchar("color"), // CSS color for gradient
  criteria: jsonb("criteria"), // Conditions to earn badge
  createdAt: timestamp("created_at").defaultNow(),
});

// User badge achievements
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  badgeId: integer("badge_id").references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Study sessions for progress tracking
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  questionsAnswered: integer("questions_answered").default(0),
  averageScore: real("average_score").default(0),
  subject: varchar("subject"),
  totalTimeSpent: integer("total_time_spent").default(0), // seconds
});

// Question recommendations
export const questionRecommendations = pgTable("question_recommendations", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  recommendationScore: real("recommendation_score").notNull(),
  reason: text("reason"),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  examPapers: many(examPapers),
  studentAnswers: many(studentAnswers),
  userBadges: many(userBadges),
  studySessions: many(studySessions),
  questionRecommendations: many(questionRecommendations),
}));

export const examPapersRelations = relations(examPapers, ({ one, many }) => ({
  uploadedByUser: one(users, {
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
  verifiedByUser: one(users, {
    fields: [questions.verifiedBy],
    references: [users.id],
  }),
  studentAnswers: many(studentAnswers),
  questionRecommendations: many(questionRecommendations),
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

export const questionRecommendationsRelations = relations(questionRecommendations, ({ one }) => ({
  student: one(users, {
    fields: [questionRecommendations.studentId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [questionRecommendations.questionId],
    references: [questions.id],
  }),
}));

// Insert schemas
export const insertExamPaperSchema = createInsertSchema(examPapers).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({
  id: true,
  createdAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ExamPaper = typeof examPapers.$inferSelect;
export type InsertExamPaper = z.infer<typeof insertExamPaperSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type QuestionRecommendation = typeof questionRecommendations.$inferSelect;
