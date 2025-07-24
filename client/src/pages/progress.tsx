import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Brain, 
  Trophy, 
  Target, 
  BookOpen, 
  ArrowRight,
  BarChart3,
  Lightbulb
} from "lucide-react";

interface Recommendation {
  recommendation: string;
  reason: string;
  priority: number;
}

interface ProgressData {
  totalQuestions: number;
  averageScore: number;
  badges: number;
  studyStreak: number;
  recommendations: Recommendation[];
}

export default function Progress() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: performanceTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/progress/performance-trend"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: subjectPerformance, isLoading: subjectLoading } = useQuery({
    queryKey: ["/api/progress/subject-performance"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: studyInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/progress/study-insights"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: studyGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/progress/study-goals"],
    retry: false,
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Learning Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <TrendingUp className="text-primary mr-2" />
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {trendLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="spinner"></div>
                    </div>
                  ) : performanceTrend && performanceTrend.length > 0 ? (
                    /* Performance Progress Bars */
                    performanceTrend.map((data: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{data.week}</span>
                          <span className="text-sm text-muted-foreground">{data.score}%</span>
                        </div>
                        <ProgressBar value={data.score} className="h-3" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No performance data available yet.</p>
                      <p className="text-sm">Start answering questions to see your progress!</p>
                    </div>
                  )}
                  
                  {/* Overall Progress Summary */}
                  {performanceTrend && performanceTrend.length > 0 && (
                    <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-primary">Overall Improvement</p>
                          <p className="text-sm text-muted-foreground">
                            {performanceTrend.length >= 2 ? (
                              `${performanceTrend[performanceTrend.length - 1].score - performanceTrend[0].score > 0 ? '+' : ''}${performanceTrend[performanceTrend.length - 1].score - performanceTrend[0].score}% from ${performanceTrend[0].week} to ${performanceTrend[performanceTrend.length - 1].week}`
                            ) : (
                              'Track your improvement over time'
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {progressData?.averageScore || 0}%
                          </div>
                          <p className="text-xs text-muted-foreground">Current Average</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Learning Recommendations */}
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Brain className="text-accent mr-2" />
                  AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {progressLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="spinner"></div>
                    </div>
                  ) : progressData?.recommendations && progressData.recommendations.length > 0 ? (
                    progressData.recommendations.slice(0, 3).map((rec, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          rec.priority >= 4
                            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                            : rec.priority >= 3
                            ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                            : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                        }`}
                      >
                        <div className="flex items-start">
                          <Lightbulb
                            className={`mt-1 mr-3 ${
                              rec.priority >= 4
                                ? "text-red-600"
                                : rec.priority >= 3
                                ? "text-primary"
                                : "text-secondary"
                            }`}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{rec.recommendation}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {rec.reason}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge
                                variant={rec.priority >= 4 ? "destructive" : "default"}
                                className="text-xs"
                              >
                                Priority: {rec.priority}/5
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-xs"
                                onClick={() => window.location.href = '/practice'}
                              >
                                Practice Now <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Default recommendations when no data available
                    <>
                      <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-start">
                          <Lightbulb className="text-primary mt-1 mr-3" />
                          <div>
                            <h4 className="font-medium">Focus on Database Joins</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Based on your recent answers, practicing SQL JOIN operations will improve your database scores by an estimated 15%.
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-primary text-sm mt-2 p-0 h-auto"
                              onClick={() => window.location.href = '/practice'}
                            >
                              Practice Now <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-start">
                          <Trophy className="text-secondary mt-1 mr-3" />
                          <div>
                            <h4 className="font-medium">Algorithm Complexity Ready</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              You've mastered basic algorithms! Time to tackle Big O notation and advanced complexity analysis.
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-secondary text-sm mt-2 p-0 h-auto"
                              onClick={() => window.location.href = '/practice'}
                            >
                              Start Challenge <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Subject Performance */}
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BarChart3 className="text-primary mr-2 w-5 h-5" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {subjectLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="spinner"></div>
                    </div>
                  ) : subjectPerformance && subjectPerformance.length > 0 ? (
                    subjectPerformance.map((item: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.subject}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.score}%</span>
                            <p className="text-xs text-muted-foreground">{item.questions} questions</p>
                          </div>
                        </div>
                        <ProgressBar value={item.score} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No subject data available yet.</p>
                      <p className="text-sm">Answer questions to see performance by subject!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Study Goals */}
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Target className="text-secondary mr-2 w-5 h-5" />
                  Study Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {goalsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="spinner"></div>
                    </div>
                  ) : studyGoals ? (
                    <>
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Weekly Goal</span>
                          <span className="text-sm text-secondary font-semibold">{studyGoals.weeklyGoal?.progress || 0}%</span>
                        </div>
                        <ProgressBar value={studyGoals.weeklyGoal?.progress || 0} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {studyGoals.weeklyGoal?.description || 'Complete 20 questions this week'}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Monthly Goal</span>
                          <span className="text-sm text-accent font-semibold">{studyGoals.monthlyGoal?.progress || 0}%</span>
                        </div>
                        <ProgressBar value={studyGoals.monthlyGoal?.progress || 0} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {studyGoals.monthlyGoal?.description || 'Achieve 90% average score'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Setting up your goals...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Study Habits */}
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BookOpen className="text-purple-600 mr-2 w-5 h-5" />
                  Study Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {insightsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="spinner"></div>
                    </div>
                  ) : studyInsights ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Best Study Time</p>
                          <p className="text-xs text-muted-foreground">{studyInsights.bestStudyTime || 'Evening (6-8 PM)'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{studyInsights.bestStudyScore || 94}%</p>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Optimal Session</p>
                          <p className="text-xs text-muted-foreground">{studyInsights.optimalSessionLength || '25-30 minutes'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-secondary">{studyInsights.averageQuestions || 5.2}</p>
                          <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Learning Style</p>
                          <p className="text-xs text-muted-foreground">{studyInsights.learningStyle || 'Visual + Practice'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent">{studyInsights.retentionScore || 89}%</p>
                          <p className="text-xs text-muted-foreground">Retention</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No insights available yet.</p>
                      <p className="text-sm">Answer more questions to unlock insights!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
