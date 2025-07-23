import {
  users,
  examPapers,
  questions,
  studentAnswers,
  badges,
  userBadges,
  studySessions,
  type User,
  type UpsertUser,
  type ExamPaper,
  type InsertExamPaper,
  type Question,
  type InsertQuestion,
  type StudentAnswer,
  type InsertStudentAnswer,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type StudySession,
  type InsertStudySession,

} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, avg } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Exam Paper operations
  createExamPaper(examPaper: InsertExamPaper): Promise<ExamPaper>;
  getExamPapers(): Promise<ExamPaper[]>;
  getExamPaper(id: number): Promise<ExamPaper | undefined>;
  updateExamPaperStatus(id: number, status: string, totalQuestions?: number): Promise<void>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestions(examPaperId?: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  updateQuestionVerification(id: number, isVerified: boolean, verifiedBy: string): Promise<void>;
  getQuestionsBySubject(subject: string, limit?: number): Promise<Question[]>;
  
  // Student Answer operations
  createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer>;
  getStudentAnswers(studentId: string, questionId?: number): Promise<StudentAnswer[]>;
  getStudentProgress(studentId: string): Promise<any>;
  
  // Badge operations
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  awardBadge(userId: string, badgeId: number): Promise<UserBadge>;
  
  // Study Session operations
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  getStudySessions(studentId: string): Promise<StudySession[]>;
  updateStudySession(id: number, updates: Partial<StudySession>): Promise<void>;
  

  
  // Analytics
  getAdminStats(): Promise<any>;
  getStudentStats(studentId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        ...userData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning();
      return user;
    } catch (error) {
      // If insert fails due to conflict, update the existing user
      const [user] = await db.update(users)
        .set({ ...userData, updatedAt: Date.now() })
        .where(eq(users.id, userData.id!))
        .returning();
      return user;
    }
  }

  // Exam Paper operations
  async createExamPaper(examPaper: InsertExamPaper): Promise<ExamPaper> {
    const [paper] = await db.insert(examPapers).values(examPaper).returning();
    return paper;
  }

  async getExamPapers(): Promise<ExamPaper[]> {
    return await db.select().from(examPapers).orderBy(desc(examPapers.createdAt));
  }

  async getExamPaper(id: number): Promise<ExamPaper | undefined> {
    const [paper] = await db.select().from(examPapers).where(eq(examPapers.id, id));
    return paper;
  }

  async updateExamPaperStatus(id: number, status: string, totalQuestions?: number): Promise<void> {
    const updates: any = { status };
    if (totalQuestions !== undefined) {
      updates.totalQuestions = totalQuestions;
    }
    await db.update(examPapers).set(updates).where(eq(examPapers.id, id));
  }

  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [q] = await db.insert(questions).values(question).returning();
    return q;
  }

  async getQuestions(examPaperId?: number): Promise<Question[]> {
    const query = db.select().from(questions);
    if (examPaperId) {
      return await query.where(eq(questions.examPaperId, examPaperId));
    }
    return await query.orderBy(desc(questions.createdAt));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async updateQuestionVerification(id: number, isVerified: boolean, verifiedBy: string): Promise<void> {
    await db.update(questions)
      .set({ isVerified, verifiedBy })
      .where(eq(questions.id, id));
  }

  async getQuestionsBySubject(subject: string, limit = 10): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(and(eq(questions.subject, subject), eq(questions.isVerified, true)))
      .limit(limit);
  }

  // Student Answer operations
  async createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer> {
    const [studentAnswer] = await db.insert(studentAnswers).values(answer).returning();
    return studentAnswer;
  }

  async getStudentAnswers(studentId: string, questionId?: number): Promise<StudentAnswer[]> {
    const query = db.select().from(studentAnswers).where(eq(studentAnswers.studentId, studentId));
    if (questionId) {
      return await query.where(and(eq(studentAnswers.studentId, studentId), eq(studentAnswers.questionId, questionId)));
    }
    return await query.orderBy(desc(studentAnswers.createdAt));
  }

  async getStudentProgress(studentId: string): Promise<any> {
    const answers = await this.getStudentAnswers(studentId);
    const totalQuestions = answers.length;
    const averageScore = totalQuestions > 0 
      ? answers.reduce((sum, answer) => sum + answer.score, 0) / totalQuestions 
      : 0;
    
    const badges = await this.getUserBadges(studentId);
    const sessions = await this.getStudySessions(studentId);
    
    return {
      totalQuestions,
      averageScore: Math.round(averageScore * 100) / 100,
      badges: badges.length,
      studyStreak: 15, // TODO: Calculate actual streak
      recentSessions: sessions.slice(0, 5),
    };
  }

  // Badge operations
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [b] = await db.insert(badges).values(badge).returning();
    return b;
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async awardBadge(userId: string, badgeId: number): Promise<UserBadge> {
    const [userBadge] = await db.insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return userBadge;
  }

  // Study Session operations
  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const [s] = await db.insert(studySessions).values(session).returning();
    return s;
  }

  async getStudySessions(studentId: string): Promise<StudySession[]> {
    return await db.select()
      .from(studySessions)
      .where(eq(studySessions.studentId, studentId))
      .orderBy(desc(studySessions.startTime));
  }

  async updateStudySession(id: number, updates: Partial<StudySession>): Promise<void> {
    await db.update(studySessions).set(updates).where(eq(studySessions.id, id));
  }

  // Recommendation operations
  async createQuestionRecommendation(recommendation: Omit<QuestionRecommendation, 'id' | 'createdAt'>): Promise<QuestionRecommendation> {
    const [rec] = await db.insert(questionRecommendations).values(recommendation).returning();
    return rec;
  }

  async getQuestionRecommendations(studentId: string, limit = 5): Promise<QuestionRecommendation[]> {
    return await db.select()
      .from(questionRecommendations)
      .where(and(eq(questionRecommendations.studentId, studentId), eq(questionRecommendations.isUsed, false)))
      .orderBy(desc(questionRecommendations.recommendationScore))
      .limit(limit);
  }

  // Analytics
  async getAdminStats(): Promise<any> {
    const [totalQuestions] = await db.select({ count: count() }).from(questions);
    const [totalStudents] = await db.select({ count: count() }).from(users).where(eq(users.role, 'student'));
    const [pendingQuestions] = await db.select({ count: count() }).from(questions).where(eq(questions.isVerified, false));
    
    return {
      totalQuestions: totalQuestions.count,
      totalStudents: totalStudents.count,
      pendingReviews: pendingQuestions.count,
      aiAccuracy: 94.2, // TODO: Calculate from actual data
    };
  }

  async getStudentStats(studentId: string): Promise<any> {
    const user = await this.getUser(studentId);
    const progress = await this.getStudentProgress(studentId);
    
    return {
      questionsCompleted: user?.questionsCompleted || 0,
      averageScore: progress.averageScore,
      badges: progress.badges,
      studyStreak: progress.studyStreak,
      currentLevel: user?.currentLevel || 'Beginner',
    };
  }
}

export const storage = new DatabaseStorage();
