import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Question {
  id: number;
  questionText: string;
  subject: string;
  topic?: string;
  difficulty: string;
  isVerified: boolean;
  aiConfidence: number;
  aiModelAnswer?: string;
  examPaperId?: number;
  questionNumber?: number;
  createdAt?: string;
}

interface ViewQuestionDialogProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewQuestionDialog({
  question,
  isOpen,
  onClose,
}: ViewQuestionDialogProps) {
  if (!question) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (isVerified: boolean) => {
    return isVerified
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Question Preview - Q{question.questionNumber || question.id}</span>
            <div className="flex items-center space-x-2">
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
              <Badge className={getStatusColor(question.isVerified)}>
                {question.isVerified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-sm font-semibold">{question.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Topic</label>
                  <p className="text-sm font-semibold">{question.topic || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">AI Confidence</label>
                  <p className="text-sm font-semibold">{Math.round((question.aiConfidence || 0) * 100)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Question Number</label>
                  <p className="text-sm font-semibold">{question.questionNumber || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.questionText}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Model Answer */}
          {question.aiModelAnswer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI-Generated Model Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {question.aiModelAnswer}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Exam Paper ID</span>
                <span className="text-sm font-semibold">{question.examPaperId || 'N/A'}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Created At</span>
                <span className="text-sm font-semibold">
                  {question.createdAt 
                    ? new Date(question.createdAt).toLocaleDateString() 
                    : 'N/A'
                  }
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Question ID</span>
                <span className="text-sm font-semibold">{question.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}