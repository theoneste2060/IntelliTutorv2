import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isStudent } from "./auth";
import { openaiService } from "./services/openai";
import { nlpService } from "./services/nlp";
import { ocrService } from "./services/ocr";
import { insertExamPaperSchema, insertQuestionSchema, insertStudentAnswerSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard endpoints
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (req.user.role === 'admin') {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } else {
        const stats = await storage.getStudentStats(userId);
        res.json(stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Question practice endpoints
  app.get('/api/questions/next', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { subject, difficulty, level, topic } = req.query;
      
      // If filters are provided, use filtered questions
      if (subject || difficulty || level || topic) {
        const filteredQuestions = await storage.getFilteredQuestions({
          subject: subject as string,
          difficulty: difficulty as string,
          level: level as string,
          topic: topic as string,
          limit: 1
        });
        
        if (filteredQuestions.length > 0) {
          res.json(filteredQuestions[0]);
          return;
        }
      }
      
      // Get personalized recommendations first
      const recommendations = await storage.getQuestionRecommendations(userId, 1);
      
      if (recommendations.length > 0) {
        res.json(recommendations[0]);
      } else {
        // Fallback to subject-based questions
        const questions = await storage.getQuestionsBySubject(subject as string || 'Mathematics', 1);
        res.json(questions[0] || null);
      }
    } catch (error) {
      console.error("Error fetching next question:", error);
      res.status(500).json({ message: "Failed to fetch next question" });
    }
  });

  app.get('/api/questions/filters', isAuthenticated, async (req: any, res) => {
    try {
      const filters = await storage.getAvailableFilters();
      res.json(filters);
    } catch (error) {
      console.error("Error fetching available filters:", error);
      res.status(500).json({ message: "Failed to fetch available filters" });
    }
  });

  app.post('/api/questions/:id/answer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const questionId = parseInt(req.params.id);
      const { answerText, timeSpent } = req.body;

      // Get the question and its model answer
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Evaluate the answer using NLP
      const nlpEvaluation = nlpService.evaluateAnswer(
        answerText,
        question.aiModelAnswer || "",
        question.questionText
      );

      // Get AI evaluation for enhanced feedback
      const aiEvaluation = await openaiService.evaluateStudentAnswer(
        question.questionText,
        answerText,
        question.aiModelAnswer || "",
        question.subject
      );

      // Combine evaluations
      const finalScore = Math.round((nlpEvaluation.overallScore + aiEvaluation.score) / 2);
      const combinedFeedback = [
        ...nlpEvaluation.feedback,
        aiEvaluation.feedback,
        ...aiEvaluation.improvements
      ].join('. ');

      // Save the student answer
      const studentAnswer = await storage.createStudentAnswer({
        studentId: userId,
        questionId,
        answerText,
        score: finalScore,
        feedback: combinedFeedback,
        evaluationDetails: JSON.stringify({
          nlp: nlpEvaluation,
          ai: aiEvaluation,
        }),
        timeSpent,
        isCorrect: finalScore >= 70,
      });

      // Update user stats for students only
      if (req.user.role === 'student') {
        const user = await storage.getUser(userId);
        if (user) {
          await storage.upsertUser({
            ...user,
            questionsCompleted: (user.questionsCompleted || 0) + 1,
            totalScore: (user.totalScore || 0) + finalScore,
          });
        }
      }

      res.json({
        score: finalScore,
        feedback: combinedFeedback,
        evaluationBreakdown: {
          tfidfScore: nlpEvaluation.tfidfScore,
          semanticScore: nlpEvaluation.semanticScore,
          grammarScore: nlpEvaluation.grammarScore,
        },
        strengths: aiEvaluation.strengths,
        improvements: aiEvaluation.improvements,
      });
    } catch (error) {
      console.error("Error evaluating answer:", error);
      res.status(500).json({ message: "Failed to evaluate answer" });
    }
  });

  // Admin endpoints
  app.post('/api/admin/upload-paper', isAuthenticated, upload.single('examPaper'), async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, subject, year, level } = req.body;
      
      // Validate the document
      await ocrService.validateDocument(req.file.buffer, req.file.originalname);

      // Create exam paper record
      const examPaper = await storage.createExamPaper({
        title,
        subject,
        year: parseInt(year),
        level,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.originalname}`, // In production, upload to cloud storage
        uploadedBy: userId,
        status: 'processing',
      });

      // Process the document with OCR in background
      processDocumentAsync(examPaper.id, req.file.buffer, req.file.originalname);

      res.json({ 
        message: "Exam paper uploaded successfully", 
        examPaperId: examPaper.id,
        status: 'processing'
      });
    } catch (error) {
      console.error("Error uploading exam paper:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to upload exam paper" });
    }
  });

  app.get('/api/admin/questions', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const subject = req.query.subject as string;
      const verified = req.query.verified as string;

      const filters = {
        search,
        subject: subject && subject !== 'all' ? subject : undefined,
        verified: verified !== undefined ? verified === 'true' : undefined
      };

      const result = await storage.getAllQuestions(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post('/api/admin/questions/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.user.id;

      const questionId = parseInt(req.params.id);
      const { isVerified } = req.body;

      await storage.updateQuestionVerification(questionId, isVerified, userId);
      
      res.json({ message: "Question verification updated" });
    } catch (error) {
      console.error("Error updating question verification:", error);
      res.status(500).json({ message: "Failed to update question verification" });
    }
  });

  app.put('/api/admin/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const questionId = parseInt(req.params.id);
      const updates = req.body;
      await storage.updateQuestion(questionId, updates);
      res.json({ message: "Question updated successfully" });
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/admin/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const questionId = parseInt(req.params.id);
      await storage.deleteQuestion(questionId);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Progress and recommendations endpoints
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getStudentProgress(userId);
      
      // Get recent answers for recommendations
      const recentAnswers = await storage.getStudentAnswers(userId);
      const answerData = recentAnswers.slice(0, 10).map(answer => ({
        questionText: '', // Would need to join with questions table
        score: answer.score,
        subject: '', // Would need to join with questions table
        topic: '',
      }));

      // Generate AI recommendations
      const aiRecommendations = await openaiService.generatePersonalizedRecommendations(
        userId,
        answerData
      );

      res.json({
        ...progress,
        recommendations: aiRecommendations,
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get('/api/progress/performance-trend', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trend = await storage.getPerformanceTrend(userId);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching performance trend:", error);
      res.status(500).json({ message: "Failed to fetch performance trend" });
    }
  });

  app.get('/api/progress/subject-performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subjectPerformance = await storage.getSubjectPerformance(userId);
      res.json(subjectPerformance);
    } catch (error) {
      console.error("Error fetching subject performance:", error);
      res.status(500).json({ message: "Failed to fetch subject performance" });
    }
  });

  app.get('/api/progress/study-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const insights = await storage.getStudyInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching study insights:", error);
      res.status(500).json({ message: "Failed to fetch study insights" });
    }
  });

  app.get('/api/progress/study-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getStudyGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching study goals:", error);
      res.status(500).json({ message: "Failed to fetch study goals" });
    }
  });

  // Background processing function
  async function processDocumentAsync(examPaperId: number, fileBuffer: Buffer, fileName: string) {
    try {
      // Process with OCR
      const ocrResult = await ocrService.processDocument(fileBuffer, fileName);
      
      // Extract questions using AI
      const subject = fileName.includes('CS') ? 'Computer Science' : 'General Studies';
      const questionExtractionResult = await openaiService.extractQuestionsFromText(
        ocrResult.text,
        subject
      );

      // Save extracted questions
      let questionsCreated = 0;
      for (const extractedQuestion of questionExtractionResult.questions) {
        // Generate model answer
        const modelAnswerResult = await openaiService.generateModelAnswer(
          extractedQuestion.questionText,
          extractedQuestion.subject
        );

        // Create question record
        await storage.createQuestion({
          examPaperId,
          questionNumber: extractedQuestion.questionNumber,
          questionText: extractedQuestion.questionText,
          subject: extractedQuestion.subject,
          topic: extractedQuestion.topic,
          difficulty: extractedQuestion.difficulty,
          learningOutcome: extractedQuestion.learningOutcome,
          aiModelAnswer: modelAnswerResult.modelAnswer,
          aiConfidence: modelAnswerResult.confidence,
          isVerified: false,
        });

        questionsCreated++;
      }

      // Update exam paper status
      await storage.updateExamPaperStatus(examPaperId, 'completed', questionsCreated);
      
      console.log(`Successfully processed exam paper ${examPaperId}: ${questionsCreated} questions extracted`);
    } catch (error) {
      console.error(`Error processing exam paper ${examPaperId}:`, error);
      await storage.updateExamPaperStatus(examPaperId, 'failed');
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
