export interface TFIDFResult {
  similarity: number;
  keywordMatches: string[];
  missingKeywords: string[];
}

export interface EvaluationResult {
  tfidfScore: number;
  semanticScore: number;
  grammarScore: number;
  overallScore: number;
  feedback: string[];
}

export class NLPService {
  // Simplified TF-IDF implementation for demonstration
  private calculateTFIDF(text1: string, text2: string): TFIDFResult {
    // Tokenize and clean text
    const tokenize = (text: string): string[] => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
    };

    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);
    
    // Calculate term frequencies
    const tf1 = this.getTermFrequency(tokens1);
    const tf2 = this.getTermFrequency(tokens2);
    
    // Get all unique terms
    const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    const keywordMatches: string[] = [];
    const missingKeywords: string[] = [];
    
    for (const term of allTerms) {
      const freq1 = tf1[term] || 0;
      const freq2 = tf2[term] || 0;
      
      dotProduct += freq1 * freq2;
      norm1 += freq1 * freq1;
      norm2 += freq2 * freq2;
      
      if (freq1 > 0 && freq2 > 0) {
        keywordMatches.push(term);
      } else if (freq1 > 0 && freq2 === 0) {
        missingKeywords.push(term);
      }
    }
    
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
    
    return {
      similarity: Math.round(similarity * 100) / 100,
      keywordMatches,
      missingKeywords,
    };
  }

  private getTermFrequency(tokens: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    const totalTokens = tokens.length;
    
    for (const token of tokens) {
      tf[token] = (tf[token] || 0) + 1;
    }
    
    // Normalize by document length
    for (const term in tf) {
      tf[term] = tf[term] / totalTokens;
    }
    
    return tf;
  }

  // Grammar and spelling check simulation
  private checkGrammar(text: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    // Basic grammar checks
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for basic issues
    const commonErrors = [
      { pattern: /\bteh\b/gi, correction: 'the' },
      { pattern: /\bdatabse\b/gi, correction: 'database' },
      { pattern: /\balgorithm\b/gi, correction: 'algorithm' },
      { pattern: /\bfunciton\b/gi, correction: 'function' },
      { pattern: /\brecieve\b/gi, correction: 'receive' },
    ];

    for (const error of commonErrors) {
      if (error.pattern.test(text)) {
        issues.push(`Spelling: Check '${error.pattern.source}' - should be '${error.correction}'`);
        score -= 5;
      }
    }

    // Check sentence structure
    for (const sentence of sentences) {
      if (sentence.trim().length > 200) {
        issues.push('Consider breaking up very long sentences for clarity');
        score -= 2;
      }
      
      if (!/[A-Z]/.test(sentence.trim()[0])) {
        issues.push('Sentences should start with capital letters');
        score -= 3;
      }
    }

    return { score: Math.max(0, score), issues };
  }

  public evaluateAnswer(
    studentAnswer: string,
    modelAnswer: string,
    questionContext?: string
  ): EvaluationResult {
    // TF-IDF similarity analysis
    const tfidfResult = this.calculateTFIDF(studentAnswer, modelAnswer);
    const tfidfScore = Math.round(tfidfResult.similarity * 100);

    // Grammar and spelling check
    const grammarResult = this.checkGrammar(studentAnswer);
    const grammarScore = grammarResult.score;

    // Semantic analysis (simplified - would use spaCy in production)
    const semanticScore = this.calculateSemanticSimilarity(studentAnswer, modelAnswer);

    // Overall score calculation
    const overallScore = Math.round(
      (tfidfScore * 0.4) + (semanticScore * 0.4) + (grammarScore * 0.2)
    );

    // Generate feedback
    const feedback: string[] = [];
    
    if (tfidfScore >= 80) {
      feedback.push("Excellent keyword coverage and terminology usage!");
    } else if (tfidfScore >= 60) {
      feedback.push("Good use of key terms, but consider including more specific concepts.");
    } else {
      feedback.push("Try to include more relevant technical terminology in your answer.");
    }

    if (grammarResult.issues.length > 0) {
      feedback.push(...grammarResult.issues);
    } else {
      feedback.push("Well-written with clear grammar and spelling.");
    }

    if (tfidfResult.keywordMatches.length > 0) {
      feedback.push(`Strong points: You mentioned ${tfidfResult.keywordMatches.slice(0, 3).join(', ')}`);
    }

    if (tfidfResult.missingKeywords.length > 0) {
      feedback.push(`Consider covering: ${tfidfResult.missingKeywords.slice(0, 3).join(', ')}`);
    }

    return {
      tfidfScore,
      semanticScore,
      grammarScore,
      overallScore,
      feedback,
    };
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    // Simplified semantic similarity - in production would use spaCy word vectors
    const words1 = new Set(text1.toLowerCase().split(/\W+/));
    const words2 = new Set(text2.toLowerCase().split(/\W+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    return Math.round(jaccardSimilarity * 100);
  }

  public generateRecommendations(
    studentAnswers: Array<{ score: number; subject: string; topic?: string }>,
    limit = 5
  ): Array<{ questionId?: number; reason: string; priority: number }> {
    const recommendations: Array<{ questionId?: number; reason: string; priority: number }> = [];
    
    // Analyze performance by subject
    const subjectPerformance: Record<string, number[]> = {};
    
    for (const answer of studentAnswers) {
      if (!subjectPerformance[answer.subject]) {
        subjectPerformance[answer.subject] = [];
      }
      subjectPerformance[answer.subject].push(answer.score);
    }

    // Generate recommendations based on weak areas
    for (const [subject, scores] of Object.entries(subjectPerformance)) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (avgScore < 70) {
        recommendations.push({
          reason: `Focus on ${subject} - current average: ${Math.round(avgScore)}%`,
          priority: 5 - Math.floor(avgScore / 20), // Higher priority for lower scores
        });
      }
    }

    // Sort by priority and return top recommendations
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }
}

export const nlpService = new NLPService();
