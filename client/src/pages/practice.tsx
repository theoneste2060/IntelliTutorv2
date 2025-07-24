import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import QuestionInterface from "@/components/QuestionInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Clock, CheckCircle, RotateCcw, ArrowRight, Filter, Shuffle } from "lucide-react";

interface Question {
  id: number;
  questionText: string;
  subject: string;
  topic?: string;
  difficulty: string;
  level?: string;
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

interface AvailableFilters {
  subjects: string[];
  difficulties: string[];
  levels: string[];
  topics: string[];
}

export default function Practice() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Filter states
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // Query for available filters
  const { data: availableFilters } = useQuery<AvailableFilters>({
    queryKey: ["/api/questions/filters"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: question, isLoading: questionLoading, refetch: refetchQuestion } = useQuery({
    queryKey: ["/api/questions/next", selectedSubject, selectedDifficulty, selectedLevel, selectedTopic],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (selectedTopic !== 'all') params.append('topic', selectedTopic);
      
      const response = await apiRequest("GET", `/api/questions/next${params.toString() ? `?${params.toString()}` : ''}`);
      return response.json();
    },
    retry: false,
    enabled: isAuthenticated,
  });

  // Handle question change side effects
  useEffect(() => {
    if (question) {
      setStartTime(new Date());
      setShowFeedback(false);
      setEvaluation(null);
      setCurrentAnswer("");
      setTimeSpent(0);
    }
  }, [question]);

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
        {/* Question Filters Section */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Filter className="mr-2 w-5 h-5" />
                Question Preferences
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Subject</SelectItem>
                      {availableFilters?.subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Difficulty</SelectItem>
                      {availableFilters?.difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Level Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Level</label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Level</SelectItem>
                      {availableFilters?.levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Topic</label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Topic</SelectItem>
                      {availableFilters?.topics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Filters help you practice specific topics and difficulty levels
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubject("all");
                      setSelectedDifficulty("all");
                      setSelectedLevel("all");
                      setSelectedTopic("all");
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchQuestion()}
                  >
                    <Shuffle className="mr-2 w-4 h-4" />
                    New Question
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

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
                    <div className="flex items-center space-x-2 opacity-90">
                      <span>NESA Past Exam</span>
                      <span>•</span>
                      <span>{question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1)} Level</span>
                      {question.level && (
                        <>
                          <span>•</span>
                          <span>{question.level}</span>
                        </>
                      )}
                      {question.topic && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {question.topic}
                          </Badge>
                        </>
                      )}
                    </div>
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
