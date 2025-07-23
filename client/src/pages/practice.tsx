import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import QuestionInterface from "@/components/QuestionInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, CheckCircle, RotateCcw, ArrowRight } from "lucide-react";

interface Question {
  id: number;
  questionText: string;
  subject: string;
  topic?: string;
  difficulty: string;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  evaluationBreakdown: {
    tfidfScore: number;
    semanticScore: number;
    grammarScore: number;
  };
  strengths: string[];
  improvements: string[];
}

export default function Practice() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

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

  // Timer effect
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const { data: question, isLoading: questionLoading, refetch: refetchQuestion } = useQuery({
    queryKey: ["/api/questions/next"],
    retry: false,
    enabled: isAuthenticated,
    onSuccess: () => {
      setStartTime(new Date());
      setShowFeedback(false);
      setEvaluation(null);
      setCurrentAnswer("");
      setTimeSpent(0);
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answerText, timeSpent }: { questionId: number; answerText: string; timeSpent: number }) => {
      const response = await apiRequest("POST", `/api/questions/${questionId}/answer`, {
        answerText,
        timeSpent
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEvaluation(data);
      setShowFeedback(true);
      toast({
        title: "Answer Evaluated",
        description: `Score: ${data.score}% - ${data.score >= 70 ? 'Great job!' : 'Keep practicing!'}`,
        variant: data.score >= 70 ? "default" : "destructive",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAnswer = () => {
    if (!question || !currentAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please provide an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitAnswerMutation.mutate({
      questionId: question.id,
      answerText: currentAnswer,
      timeSpent
    });
  };

  const handleNextQuestion = () => {
    refetchQuestion();
  };

  const handleTryAgain = () => {
    setShowFeedback(false);
    setCurrentAnswer("");
    setStartTime(new Date());
    setTimeSpent(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        <section className="mb-12">
          {questionLoading ? (
            <Card className="question-container">
              <CardContent className="p-8 text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading next question...</p>
              </CardContent>
            </Card>
          ) : !question ? (
            <Card className="question-container">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No questions available at the moment.</p>
                <Button onClick={() => refetchQuestion()} className="mt-4">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="question-container">
              <div className="question-header">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">{question.subject} - Question</h3>
                    <p className="opacity-90">NESA Past Exam • {question.difficulty} Level</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Time</p>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">{formatTime(timeSpent)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                {/* AI Processing Indicator */}
                <div className="ai-indicator mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-primary">AI-Generated Model Answer Available</span>
                  </div>
                  <div className="ml-auto flex items-center text-xs text-muted-foreground">
                    <Brain className="mr-1 w-4 h-4" />
                    NLP Analysis: spaCy + NLTK
                  </div>
                </div>

                <QuestionInterface
                  question={question}
                  answer={currentAnswer}
                  onAnswerChange={setCurrentAnswer}
                  onSubmit={handleSubmitAnswer}
                  isSubmitting={submitAnswerMutation.isPending}
                  showSubmitButton={!showFeedback}
                />

                {/* AI Feedback Section */}
                {showFeedback && evaluation && (
                  <div className="feedback-section mt-6">
                    <div className="bg-gradient-to-r from-secondary to-green-600 text-secondary-foreground p-4 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">AI Analysis Complete</h4>
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl font-bold">{evaluation.score}%</div>
                          <CheckCircle className="text-xl" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-card rounded-b-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold mb-3 flex items-center">
                            <Brain className="text-accent mr-2" />
                            Personalized Feedback
                          </h5>
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">{evaluation.feedback}</p>
                            {evaluation.strengths.map((strength, index) => (
                              <p key={index} className="flex items-start text-secondary">
                                <CheckCircle className="mr-2 mt-1 w-4 h-4" />
                                <span>{strength}</span>
                              </p>
                            ))}
                            {evaluation.improvements.map((improvement, index) => (
                              <p key={index} className="flex items-start text-accent">
                                <Brain className="mr-2 mt-1 w-4 h-4" />
                                <span>{improvement}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold mb-3 flex items-center">
                            <Brain className="text-primary mr-2" />
                            NLP Analysis Breakdown
                          </h5>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Semantic Similarity (TF-IDF)</span>
                                <span>{evaluation.evaluationBreakdown.tfidfScore}%</span>
                              </div>
                              <Progress value={evaluation.evaluationBreakdown.tfidfScore} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Key Concept Coverage</span>
                                <span>{evaluation.evaluationBreakdown.semanticScore}%</span>
                              </div>
                              <Progress value={evaluation.evaluationBreakdown.semanticScore} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Grammar & Spelling</span>
                                <span>{evaluation.evaluationBreakdown.grammarScore}%</span>
                              </div>
                              <Progress value={evaluation.evaluationBreakdown.grammarScore} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center mt-6 space-x-4">
                        <Button onClick={handleNextQuestion} className="btn-primary">
                          <ArrowRight className="mr-2 w-4 h-4" />
                          Next Question
                        </Button>
                        <Button onClick={handleTryAgain} variant="outline" className="btn-outline">
                          <RotateCcw className="mr-2 w-4 h-4" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
