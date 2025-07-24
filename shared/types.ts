// Statistics types for API responses
export interface AdminStats {
  totalQuestions: number;
  totalStudents: number;
  pendingReviews: number;
  aiAccuracy: number;
}

export interface StudentStats {
  questionsCompleted: number;
  averageScore: number;
  badges: number;
  studyStreak: number;
  currentLevel: string;
}

// Questions API response types
export interface QuestionsResponse {
  questions: Array<any>;
  total: number;
  page: number;
  limit: number;
}

// Badge types
export interface UserBadgeWithDetails {
  id: number;
  userId: string;
  badgeId: number;
  earnedAt: number;
  badge: {
    id: number;
    name: string;
    description: string;
    iconUrl: string;
    criteria: string;
  };
}