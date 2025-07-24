import { useState } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Question {
  id: number;
  questionText: string;
  subject: string;
  topic?: string;
  difficulty: string;
  aiModelAnswer?: string;
  questionNumber?: number;
}

interface EditQuestionDialogProps {
  question: Question | null;
  open: boolean;
  onClose: () => void;
  onSave: (questionId: number, updates: Partial<Question>) => void;
  isLoading?: boolean;
}

export default function EditQuestionDialog({
  question,
  open,
  onClose,
  onSave,
  isLoading = false
}: EditQuestionDialogProps) {
  const [formData, setFormData] = useState({
    questionText: question?.questionText || "",
    subject: question?.subject || "",
    topic: question?.topic || "",
    difficulty: question?.difficulty || "medium",
    aiModelAnswer: question?.aiModelAnswer || ""
  });

  // Update form data when question changes
  React.useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic || "",
        difficulty: question.difficulty,
        aiModelAnswer: question.aiModelAnswer || ""
      });
    }
  }, [question]);

  const handleSave = () => {
    if (question && formData.questionText.trim()) {
      onSave(question.id, {
        questionText: formData.questionText,
        subject: formData.subject,
        topic: formData.topic || undefined,
        difficulty: formData.difficulty,
        aiModelAnswer: formData.aiModelAnswer || undefined
      });
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (question) {
      setFormData({
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic || "",
        difficulty: question.difficulty,
        aiModelAnswer: question.aiModelAnswer || ""
      });
    }
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question #{question.questionNumber || question.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="questionText">Question Text</Label>
            <textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
              rows={4}
              className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="Enter the question text..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Enter topic/category..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="aiModelAnswer">Model Answer</Label>
            <textarea
              id="aiModelAnswer"
              value={formData.aiModelAnswer}
              onChange={(e) => setFormData(prev => ({ ...prev, aiModelAnswer: e.target.value }))}
              rows={6}
              className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="Enter the model answer for this question..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.questionText.trim() || isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}