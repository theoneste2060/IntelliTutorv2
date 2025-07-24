import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Lightbulb, MessageCircleQuestion, Trophy, Medal, Clock } from "lucide-react";
import { Link } from "wouter";
import type { StudentStats, AdminStats, UserBadgeWithDetails } from "@shared/types";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats | AdminStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<UserBadgeWithDetails[]>({
    queryKey: ["/api/dashboard/badges"],
    retry: false,
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
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome Back, {user?.role === 'admin' ? 'Admin' : 'Student'}!
            </h2>
            {user?.role !== 'admin' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Current Level:</span>
                <Badge className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {(stats as StudentStats)?.currentLevel || 'Beginner'}
                </Badge>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {user?.role === 'admin' ? (
              <>
                <StatsCard
                  icon={MessageCircleQuestion}
                  iconColor="text-primary"
                  iconBg="bg-blue-100 dark:bg-blue-900"
                  title="Total Questions"
                  value={statsLoading ? "..." : (stats as AdminStats)?.totalQuestions?.toString() || "0"}
                />
                <StatsCard
                  icon={Trophy}
                  iconColor="text-green-600"
                  iconBg="bg-green-100 dark:bg-green-900"
                  title="Total Students"
                  value={statsLoading ? "..." : (stats as AdminStats)?.totalStudents?.toString() || "0"}
                />
                <StatsCard
                  icon={Clock}
                  iconColor="text-orange-600"
                  iconBg="bg-orange-100 dark:bg-orange-900"
                  title="Pending Reviews"
                  value={statsLoading ? "..." : (stats as AdminStats)?.pendingReviews?.toString() || "0"}
                />
                <StatsCard
                  icon={Medal}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-100 dark:bg-purple-900"
                  title="AI Accuracy"
                  value={statsLoading ? "..." : `${(stats as AdminStats)?.aiAccuracy || 0}%`}
                />
              </>
            ) : (
              <>
                <StatsCard
                  icon={MessageCircleQuestion}
                  iconColor="text-primary"
                  iconBg="bg-blue-100 dark:bg-blue-900"
                  title="Questions Completed"
                  value={statsLoading ? "..." : (stats as StudentStats)?.questionsCompleted?.toString() || "0"}
                />
                
                <StatsCard
                  icon={Trophy}
                  iconColor="text-secondary"
                  iconBg="bg-green-100 dark:bg-green-900"
                  title="Average Score"
                  value={statsLoading ? "..." : `${(stats as StudentStats)?.averageScore || 0}%`}
                />
                
                <StatsCard
                  icon={Medal}
                  iconColor="text-accent"
                  iconBg="bg-orange-100 dark:bg-orange-900"
                  title="Badges Earned"
                  value={statsLoading ? "..." : (stats as StudentStats)?.badges?.toString() || "0"}
                />
                
                <StatsCard
                  icon={Clock}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-100 dark:bg-purple-900"
                  title="Study Streak"
                  value={statsLoading ? "..." : `${(stats as StudentStats)?.studyStreak || 0} days`}
                />
              </>
            )}
          </div>

          {/* Quick Actions & Recent Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-card p-6 rounded-lg elevation-1">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/practice">
                  <Button className="w-full flex items-center p-4 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-all group h-auto">
                    <Play className="text-2xl mr-3 group-hover:animate-pulse" />
                    <div className="text-left">
                      <p className="font-semibold">Continue Practice</p>
                      <p className="text-sm opacity-75">Database Questions</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/progress">
                  <Button variant="outline" className="w-full flex items-center p-4 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground rounded-lg transition-all group h-auto">
                    <Lightbulb className="text-2xl mr-3" />
                    <div className="text-left">
                      <p className="font-semibold">AI Recommendations</p>
                      <p className="text-sm opacity-75">Personalized for you</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
            
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold">Recent Badges</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {badgesLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="spinner"></div>
                    </div>
                  ) : badges && badges.length > 0 ? (
                    badges.slice(0, 2).map((badge, index: number) => (
                      <div key={index} className="flex items-center p-2 bg-muted/50 dark:bg-muted/20 rounded-lg">
                        <div className={`badge-container badge-gradient-${(index % 3) + 1}`}>
                          <Medal className="w-5 h-5" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-sm">Badge #{badge.badgeId}</p>
                          <p className="text-xs text-muted-foreground">Recently earned</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No badges yet</p>
                      <p className="text-xs text-muted-foreground">Start practicing to earn your first badge!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <Link href="/practice">
        <button className="fab">
          <Play className="text-xl" />
        </button>
      </Link>
    </div>
  );
}
