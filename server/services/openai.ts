import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface QuestionExtractionResult {
  questions: Array<{
    questionNumber: number;
    questionText: string;
    subject: string;
    topic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    learningOutcome?: string;
  }>;
}

export interface ModelAnswerResult {
  modelAnswer: string;
  confidence: number;
  keyPoints: string[];
}

export interface AnswerEvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  grammarIssues: string[];
}

export class OpenAIService {
  async extractQuestionsFromText(text: string, subject: string): Promise<QuestionExtractionResult> {
    try {
      const prompt = `
        Extract all questions from this exam paper text. For each question, identify:
        - Question number
        - Complete question text
        - Subject (given: ${subject})
        - Topic/subtopic if identifiable
        - Difficulty level (easy/medium/hard)
        - Learning outcome if mentioned

        Text: ${text}

        Respond with JSON in this format:
        {
          "questions": [
            {
              "questionNumber": 1,
              "questionText": "Complete question text...",
              "subject": "${subject}",
              "topic": "Database Normalization",
              "difficulty": "medium",
              "learningOutcome": "Understand database design principles"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in educational content extraction and analysis. Extract questions accurately from exam papers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
      return result;
    } catch (error) {
      console.error("Error extracting questions:", error);
      throw new Error("Failed to extract questions from text");
    }
  }

  async generateModelAnswer(questionText: string, subject: string): Promise<ModelAnswerResult> {
    try {
      const prompt = `
        Generate a comprehensive model answer for this ${subject} question:
        
        Question: ${questionText}
        
        Provide:
        1. A detailed, accurate answer
        2. Key points that should be covered
        3. Your confidence level (0-1) in the answer quality
        
        Respond with JSON in this format:
        {
          "modelAnswer": "Detailed answer text...",
          "confidence": 0.95,
          "keyPoints": ["Point 1", "Point 2", "Point 3"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert ${subject} educator with deep knowledge of exam standards and marking schemes.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"modelAnswer": "", "confidence": 0, "keyPoints": []}');
      return result;
    } catch (error) {
      console.error("Error generating model answer:", error);
      throw new Error("Failed to generate model answer");
    }
  }

  async evaluateStudentAnswer(
    questionText: string, 
    studentAnswer: string, 
    modelAnswer: string,
    subject: string
  ): Promise<AnswerEvaluationResult> {
    try {
      const prompt = `
        Evaluate this student answer against the model answer for a ${subject} question.
        
        Question: ${questionText}
        
        Model Answer: ${modelAnswer}
        
        Student Answer: ${studentAnswer}
        
        Provide:
        1. Score out of 100
        2. Personalized feedback
        3. What the student did well (strengths)
        4. Areas for improvement
        5. Any grammar/spelling issues
        
        Respond with JSON in this format:
        {
          "score": 78,
          "feedback": "Good understanding of concepts but missing key details...",
          "strengths": ["Clear explanation of X", "Good examples"],
          "improvements": ["Need to elaborate on Y", "Missing Z concept"],
          "grammarIssues": ["Spelling: 'databse' should be 'database'"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an experienced educator who provides constructive, personalized feedback to help students improve."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"score": 0, "feedback": "", "strengths": [], "improvements": [], "grammarIssues": []}');
      return result;
    } catch (error) {
      console.error("Error evaluating student answer:", error);
      throw new Error("Failed to evaluate student answer");
    }
  }

  async generatePersonalizedRecommendations(
    studentId: string,
    recentAnswers: Array<{ questionText: string; score: number; subject: string; topic?: string }>
  ): Promise<Array<{ recommendation: string; reason: string; priority: number }>> {
    try {
      const prompt = `
        Based on this student's recent performance, generate personalized learning recommendations:
        
        Recent Answers:
        ${recentAnswers.map(answer => 
          `Subject: ${answer.subject}, Topic: ${answer.topic || 'General'}, Score: ${answer.score}%`
        ).join('\n')}
        
        Provide 3-5 specific, actionable recommendations with reasons and priority levels (1-5).
        
        Respond with JSON in this format:
        {
          "recommendations": [
            {
              "recommendation": "Focus on database JOIN operations",
              "reason": "Scored below 70% on recent database questions",
              "priority": 4
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI tutor that provides personalized learning recommendations based on student performance patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw new Error("Failed to generate recommendations");
    }
  }
}

export const openaiService = new OpenAIService();
