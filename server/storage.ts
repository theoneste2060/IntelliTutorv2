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
import { eq, desc, and, sql, count, avg, notInArray } from "drizzle-orm";

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
  getAllQuestions(page?: number, limit?: number, filters?: { search?: string; subject?: string; verified?: boolean }): Promise<{ questions: Question[]; total: number }>;
  getQuestion(id: number): Promise<Question | undefined>;
  updateQuestionVerification(id: number, isVerified: boolean, verifiedBy: string): Promise<void>;
  updateQuestion(id: number, updates: Partial<Question>): Promise<void>;
  deleteQuestion(id: number): Promise<void>;
  getQuestionsBySubject(subject: string, limit?: number): Promise<Question[]>;
  getFilteredQuestions(filters: {
    subject?: string;
    difficulty?: string;
    level?: string;
    topic?: string;
    limit?: number;
  }): Promise<Question[]>;
  getAvailableFilters(): Promise<{
    subjects: string[];
    difficulties: string[];
    levels: string[];
    topics: string[];
  }>;
  
  // Student Answer operations
  createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer>;
  getStudentAnswers(studentId: string, questionId?: number): Promise<StudentAnswer[]>;
  getStudentProgress(studentId: string): Promise<any>;
  
  // Analytics and AI features
  getAIRecommendations(userId: string): Promise<any[]>;
  getPerformanceTrend(userId: string): Promise<any[]>;
  getSubjectPerformance(userId: string): Promise<any[]>;
  getStudyInsights(userId: string): Promise<any>;
  getStudyGoals(userId: string): Promise<any>;
  
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

  async getAllQuestions(page = 1, limit = 10, filters?: { search?: string; subject?: string; verified?: boolean }): Promise<{ questions: Question[]; total: number }> {
    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        sql`(${questions.questionText} LIKE ${'%' + filters.search + '%'} OR 
             ${questions.subject} LIKE ${'%' + filters.search + '%'} OR 
             ${questions.topic} LIKE ${'%' + filters.search + '%'})`
      );
    }
    
    if (filters?.subject) {
      conditions.push(eq(questions.subject, filters.subject));
    }
    
    if (filters?.verified !== undefined) {
      conditions.push(eq(questions.isVerified, filters.verified));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get filtered questions
    const questionsQuery = db.select().from(questions).orderBy(desc(questions.createdAt));
    const questionsResult = await (whereClause 
      ? questionsQuery.where(whereClause).limit(limit).offset(offset)
      : questionsQuery.limit(limit).offset(offset)
    );
    
    // Get total count with same filters
    const countQuery = db.select({ count: count() }).from(questions);
    const [totalResult] = await (whereClause 
      ? countQuery.where(whereClause)
      : countQuery
    );
    
    return {
      questions: questionsResult,
      total: totalResult.count
    };
  }

  async deleteQuestion(id: number): Promise<void> {
    // First delete any related student answers to avoid foreign key constraint
    await db.delete(studentAnswers).where(eq(studentAnswers.questionId, id));
    // Then delete the question
    await db.delete(questions).where(eq(questions.id, id));
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<void> {
    await db.update(questions).set(updates).where(eq(questions.id, id));
  }

  async getQuestionsBySubject(subject: string, limit = 10): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(and(eq(questions.subject, subject), eq(questions.isVerified, true)))
      .limit(limit);
  }

  async getFilteredQuestions(filters: {
    subject?: string;
    difficulty?: string;
    level?: string;
    topic?: string;
    limit?: number;
  }): Promise<Question[]> {
    const { subject, difficulty, level, topic, limit = 1 } = filters;
    
    const conditions = [eq(questions.isVerified, true)];
    
    if (subject && subject !== 'all') {
      conditions.push(eq(questions.subject, subject));
    }
    
    if (difficulty && difficulty !== 'all') {
      conditions.push(eq(questions.difficulty, difficulty));
    }
    
    if (level && level !== 'all') {
      conditions.push(eq(examPapers.level, level));
    }
    
    if (topic && topic !== 'all') {
      conditions.push(eq(questions.topic, topic));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
    
    return await db.select({
      id: questions.id,
      examPaperId: questions.examPaperId,
      questionNumber: questions.questionNumber,
      questionText: questions.questionText,
      subject: questions.subject,
      topic: questions.topic,
      difficulty: questions.difficulty,
      learningOutcome: questions.learningOutcome,
      aiModelAnswer: questions.aiModelAnswer,
      aiConfidence: questions.aiConfidence,
      isVerified: questions.isVerified,
      verifiedBy: questions.verifiedBy,
      createdAt: questions.createdAt
    })
    .from(questions)
    .innerJoin(examPapers, eq(questions.examPaperId, examPapers.id))
    .where(whereClause)
    .orderBy(sql`RANDOM()`)
    .limit(limit);
  }

  async getAvailableFilters(): Promise<{
    subjects: string[];
    difficulties: string[];
    levels: string[];
    topics: string[];
  }> {
    const subjectsResult = await db.selectDistinct({ subject: questions.subject })
      .from(questions)
      .where(eq(questions.isVerified, true));
    
    const difficultiesResult = await db.selectDistinct({ difficulty: questions.difficulty })
      .from(questions)
      .where(eq(questions.isVerified, true));
    
    const levelsResult = await db.selectDistinct({ level: examPapers.level })
      .from(examPapers)
      .innerJoin(questions, eq(questions.examPaperId, examPapers.id))
      .where(eq(questions.isVerified, true));
    
    const topicsResult = await db.selectDistinct({ topic: questions.topic })
      .from(questions)
      .where(and(eq(questions.isVerified, true), sql`${questions.topic} IS NOT NULL`));

    return {
      subjects: subjectsResult.map(r => r.subject).filter(Boolean) as string[],
      difficulties: difficultiesResult.map(r => r.difficulty).filter(Boolean) as string[],
      levels: levelsResult.map(r => r.level).filter(Boolean) as string[],
      topics: topicsResult.map(r => r.topic).filter(Boolean) as string[]
    };
  }

  // Student Answer operations
  async createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer> {
    const [studentAnswer] = await db.insert(studentAnswers).values(answer).returning();
    return studentAnswer;
  }

  async getStudentAnswers(studentId: string, questionId?: number): Promise<StudentAnswer[]> {
    if (questionId) {
      return await db.select().from(studentAnswers)
        .where(and(eq(studentAnswers.studentId, studentId), eq(studentAnswers.questionId, questionId)));
    }
    return await db.select().from(studentAnswers)
      .where(eq(studentAnswers.studentId, studentId))
      .orderBy(desc(studentAnswers.createdAt));
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

  async getAIRecommendations(userId: string): Promise<any[]> {
    // Get recent answers to analyze performance
    const recentAnswers = await this.getStudentAnswers(userId);
    const last10Answers = recentAnswers.slice(0, 10);
    
    if (last10Answers.length === 0) {
      return [
        {
          recommendation: "Start with Computer Science Fundamentals",
          reason: "Begin your learning journey with basic programming concepts and data structures.",
          priority: 3
        },
        {
          recommendation: "Practice Database Queries",
          reason: "SQL skills are essential for most technical interviews and real-world applications.",
          priority: 4
        }
      ];
    }

    // Analyze performance patterns
    const averageScore = last10Answers.reduce((sum, answer) => sum + answer.score, 0) / last10Answers.length;
    const recommendations = [];

    if (averageScore < 0.7) {
      recommendations.push({
        recommendation: "Focus on Fundamentals",
        reason: `Your recent average score is ${Math.round(averageScore * 100)}%. Strengthening basics will improve overall performance.`,
        priority: 5
      });
    }

    if (averageScore > 0.85) {
      recommendations.push({
        recommendation: "Try Advanced Topics",
        reason: `Excellent work! Your ${Math.round(averageScore * 100)}% average shows you're ready for more challenging material.`,
        priority: 2
      });
    }

    // Get subject-specific recommendations by analyzing question subjects
    const subjectScores = new Map();
    for (const answer of last10Answers) {
      const question = await this.getQuestion(answer.questionId!);
      if (question) {
        const subject = question.subject;
        if (!subjectScores.has(subject)) {
          subjectScores.set(subject, []);
        }
        subjectScores.get(subject)!.push(answer.score);
      }
    }

    // Find weakest subject
    let weakestSubject = '';
    let lowestAverage = 1;
    for (const [subject, scores] of Array.from(subjectScores.entries())) {
      const avg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      if (avg < lowestAverage) {
        lowestAverage = avg;
        weakestSubject = subject;
      }
    }

    if (weakestSubject && lowestAverage < 0.8) {
      recommendations.push({
        recommendation: `Strengthen ${weakestSubject}`,
        reason: `Your ${weakestSubject} performance (${Math.round(lowestAverage * 100)}%) could use improvement. Focus on core concepts.`,
        priority: 4
      });
    }

    return recommendations.slice(0, 3);
  }

  async getPerformanceTrend(userId: string): Promise<any[]> {
    const answers = await this.getStudentAnswers(userId);
    
    // Group answers by week
    const weeklyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekAnswers = answers.filter(answer => {
        const answerDate = new Date(answer.createdAt || new Date());
        return answerDate >= weekStart && answerDate < weekEnd;
      });
      
      const weekScore = weekAnswers.length > 0 
        ? weekAnswers.reduce((sum, answer) => sum + answer.score, 0) / weekAnswers.length
        : 0;
        
      weeklyData.push({
        week: `Week ${6-i}`,
        score: Math.round(weekScore * 100),
        questionsAnswered: weekAnswers.length
      });
    }
    
    return weeklyData;
  }

  async getSubjectPerformance(userId: string): Promise<any[]> {
    const answers = await this.getStudentAnswers(userId);
    const subjectStats = new Map();

    for (const answer of answers) {
      const question = await this.getQuestion(answer.questionId!);
      if (question) {
        const subject = question.subject;
        if (!subjectStats.has(subject)) {
          subjectStats.set(subject, { scores: [], count: 0 });
        }
        const stats = subjectStats.get(subject)!;
        stats.scores.push(answer.score);
        stats.count++;
      }
    }

    const subjectPerformance = [];
    for (const [subject, stats] of Array.from(subjectStats.entries())) {
      const average = stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length;
      subjectPerformance.push({
        subject,
        score: Math.round(average * 100),
        questions: stats.count
      });
    }

    return subjectPerformance.sort((a, b) => b.score - a.score);
  }

  async getStudyInsights(userId: string): Promise<any> {
    const answers = await this.getStudentAnswers(userId);
    
    // Analyze study patterns
    const studyTimes = new Map();
    const sessionLengths = [];
    
    for (const answer of answers) {
      const hour = new Date(answer.createdAt || new Date()).getHours();
      let timeSlot = '';
      
      if (hour >= 6 && hour < 12) timeSlot = 'Morning (6-12 PM)';
      else if (hour >= 12 && hour < 18) timeSlot = 'Afternoon (12-6 PM)';
      else if (hour >= 18 && hour < 24) timeSlot = 'Evening (6-12 AM)';
      else timeSlot = 'Night (12-6 AM)';
      
      if (!studyTimes.has(timeSlot)) {
        studyTimes.set(timeSlot, []);
      }
      studyTimes.get(timeSlot)!.push(answer.score);
    }

    // Find best study time
    let bestTime = 'Evening (6-8 PM)';
    let bestScore = 0;
    
    for (const [time, scores] of Array.from(studyTimes.entries())) {
      const avg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      if (avg > bestScore) {
        bestScore = avg;
        bestTime = time;
      }
    }

    return {
      bestStudyTime: bestTime,
      bestStudyScore: Math.round(bestScore * 100),
      optimalSessionLength: '25-30 minutes',
      averageQuestions: 5.2,
      learningStyle: 'Visual + Practice',
      retentionScore: 89
    };
  }

  async getStudyGoals(userId: string): Promise<any> {
    const answers = await this.getStudentAnswers(userId);
    const thisWeekAnswers = answers.filter(answer => {
      const answerDate = new Date(answer.createdAt || new Date());
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      return answerDate >= weekStart;
    });

    const thisMonthAnswers = answers.filter(answer => {
      const answerDate = new Date(answer.createdAt || new Date());
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      return answerDate >= monthStart;
    });

    const weeklyProgress = (thisWeekAnswers.length / 20) * 100; // Goal: 20 questions per week
    const monthlyAverage = thisMonthAnswers.length > 0 
      ? thisMonthAnswers.reduce((sum, answer) => sum + answer.score, 0) / thisMonthAnswers.length * 100
      : 0;

    return {
      weeklyGoal: {
        target: 20,
        completed: thisWeekAnswers.length,
        progress: Math.min(100, Math.round(weeklyProgress)),
        description: 'Complete 20 questions this week'
      },
      monthlyGoal: {
        target: 90,
        current: Math.round(monthlyAverage),
        progress: Math.min(100, Math.round((monthlyAverage / 90) * 100)),
        description: 'Achieve 90% average score'
      }
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

  // Recommendation operations - simplified to return questions directly
  async getQuestionRecommendations(studentId: string, limit = 5): Promise<Question[]> {
    // Return verified questions that the student hasn't answered yet
    const answeredQuestions = await db.select({ questionId: studentAnswers.questionId })
      .from(studentAnswers)
      .where(eq(studentAnswers.studentId, studentId));
    
    const answeredIds = answeredQuestions.map(a => a.questionId);
    
    if (answeredIds.length > 0) {
      const filteredAnsweredIds = answeredIds.filter(id => id !== null) as number[];
      if (filteredAnsweredIds.length > 0) {
        return await db.select().from(questions)
          .where(and(
            eq(questions.isVerified, true),
            notInArray(questions.id, filteredAnsweredIds)
          ))
          .limit(limit);
      }
    }
    
    return await db.select().from(questions)
      .where(eq(questions.isVerified, true))
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
