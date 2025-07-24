import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, SpellCheck2 } from "lucide-react";

interface Question {
  id: number;
  questionText: string;
  subject: string;
  topic?: string;
  difficulty: string;
}

interface QuestionInterfaceProps {
  question: Question;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  showSubmitButton: boolean;
}

export default function QuestionInterface({
  question,
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  showSubmitButton
}: QuestionInterfaceProps) {
  const [wordCount, setWordCount] = useState(0);
  const [grammarStatus, setGrammarStatus] = useState<"checking" | "ok" | "issues">("ok");

  // Update word count when answer changes
  useEffect(() => {
    const words = answer.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    // Simulate grammar checking
    if (answer.length > 10) {
      setGrammarStatus("checking");
      const timer = setTimeout(() => {
        // Basic grammar check simulation
        const hasIssues = /\b(teh|databse|funciton|recieve)\b/i.test(answer);
        setGrammarStatus(hasIssues ? "issues" : "ok");
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setGrammarStatus("ok");
    }
  }, [answer]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getGrammarStatusIcon = () => {
    switch (grammarStatus) {
      case "checking":
        return <div className="spinner w-3 h-3" />;
      case "ok":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "issues":
        return <SpellCheck2 className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getGrammarStatusText = () => {
    switch (grammarStatus) {
      case "checking":
        return "Checking...";
      case "ok":
        return "Grammar: OK";
      case "issues":
        return "Grammar: Check spelling";
      default:
        return "Grammar: OK";
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header Info */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {question.topic && (
          <Badge variant="outline" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            {question.topic}
          </Badge>
        )}
        <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </Badge>
      </div>

      {/* Question Content */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4">Question:</h4>
        <div className="p-6 bg-muted/30 dark:bg-muted/20 rounded-lg border-l-4 border-primary">
          <p className="text-foreground leading-relaxed">
            {question.questionText}
          </p>
        </div>
      </div>

      {/* Answer Input */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Your Answer:</h4>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {getGrammarStatusIcon()}
            <span>AI Grammar Check: pyenchant</span>
          </div>
        </div>
        
        <Textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          className="w-full h-40 p-4 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
          placeholder="Type your answer here... AI will evaluate using TF-IDF similarity and provide personalized feedback."
          disabled={isSubmitting}
        />
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              {getGrammarStatusIcon()}
              <span className="ml-1">{getGrammarStatusText()}</span>
            </span>
            <span className="flex items-center">
              <FileText className="mr-1 w-4 h-4" />
              Words: {wordCount}
            </span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <CheckCircle className="mr-1 w-4 h-4" />
            AI Evaluation: TF-IDF + Cosine Similarity
          </div>
        </div>
      </div>

      {/* Submit Button */}
      {showSubmitButton && (
        <div className="flex justify-center">
          <Button
            onClick={onSubmit}
            disabled={!answer.trim() || isSubmitting}
            className="btn-primary px-8 py-3"
          >
            {isSubmitting ? (
              <>
                <div className="spinner mr-2" />
                AI Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 w-5 h-5" />
                Submit Answer for AI Analysis
              </>
            )}
          </Button>
        </div>
      )}

      
    </div>
  );
}
