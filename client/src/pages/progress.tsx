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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const mockPerformanceData = [
    { week: "Week 1", score: 65 },
    { week: "Week 2", score: 72 },
    { week: "Week 3", score: 78 },
    { week: "Week 4", score: 85 },
    { week: "Week 5", score: 88 },
    { week: "Week 6", score: 92 },
  ];

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
                  {/* Performance Progress Bars */}
                  {mockPerformanceData.map((data, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{data.week}</span>
                        <span className="text-sm text-muted-foreground">{data.score}%</span>
                      </div>
                      <ProgressBar value={data.score} className="h-3" />
                    </div>
                  ))}
                  
                  {/* Overall Progress Summary */}
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary">Overall Improvement</p>
                        <p className="text-sm text-muted-foreground">
                          +27% from Week 1 to Week 6
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
                              <Button size="sm" variant="ghost" className="text-xs">
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
                            <Button size="sm" variant="ghost" className="text-primary text-sm mt-2 p-0 h-auto">
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
                            <Button size="sm" variant="ghost" className="text-secondary text-sm mt-2 p-0 h-auto">
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
                  {[
                    { subject: "Database Systems", score: 92, questions: 45 },
                    { subject: "Algorithms", score: 87, questions: 32 },
                    { subject: "Data Structures", score: 78, questions: 28 },
                    { subject: "OOP Concepts", score: 85, questions: 35 },
                  ].map((item, index) => (
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
                  ))}
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
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Weekly Goal</span>
                      <span className="text-sm text-secondary font-semibold">85%</span>
                    </div>
                    <ProgressBar value={85} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Complete 20 questions this week
                    </p>
                  </div>
                  
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Monthly Goal</span>
                      <span className="text-sm text-accent font-semibold">72%</span>
                    </div>
                    <ProgressBar value={72} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Achieve 90% average score
                    </p>
                  </div>
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
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Best Study Time</p>
                      <p className="text-xs text-muted-foreground">Evening (6-8 PM)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">94%</p>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Optimal Session</p>
                      <p className="text-xs text-muted-foreground">25-30 minutes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary">5.2</p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Learning Style</p>
                      <p className="text-xs text-muted-foreground">Visual + Practice</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent">89%</p>
                      <p className="text-xs text-muted-foreground">Retention</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
