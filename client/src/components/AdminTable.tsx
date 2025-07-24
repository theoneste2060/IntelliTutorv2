import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Check, Trash2, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

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

interface AdminTableProps {
  questions: Question[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  searchTerm: string;
  subjectFilter: string;
  verificationFilter: string;
  onVerifyQuestion: (questionId: number, isVerified: boolean) => void;
  onEditQuestion: (questionId: number, question: Question) => void;
  onDeleteQuestion: (questionId: number) => void;
  onViewQuestion: (question: Question) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (search: string) => void;
  onSubjectFilterChange: (subject: string) => void;
  onVerificationFilterChange: (verification: string) => void;
}

export default function AdminTable({ 
  questions, 
  loading, 
  total, 
  page,
  pageSize,
  searchTerm,
  subjectFilter,
  verificationFilter,
  onVerifyQuestion, 
  onEditQuestion, 
  onDeleteQuestion, 
  onViewQuestion,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSubjectFilterChange,
  onVerificationFilterChange
}: AdminTableProps) {

  // Get unique subjects for filter dropdown
  const subjects = Array.from(new Set(questions.map(q => q.subject)));

  const getStatusBadge = (isVerified: boolean, confidence: number) => {
    if (isVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          AI Verified
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending Review
        </Badge>
      );
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    
    return (
      <Badge className={colors[difficulty.toLowerCase() as keyof typeof colors] || colors.medium}>
        {difficulty}
      </Badge>
    );
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="admin-table">
      <CardHeader className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Question Management</CardTitle>
          <div className="flex items-center space-x-4">
            {/* Page Size Selector */}
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={onSubjectFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Verification Filter */}
            <Select value={verificationFilter} onValueChange={onVerificationFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="admin-table-header">
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Question
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Subject
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Difficulty
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    AI Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Confidence
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Model Answer
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card divide-y divide-border">
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      {searchTerm || subjectFilter !== "all" || verificationFilter !== "all"
                        ? "No questions match your filters"
                        : "No questions available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id} className="hover:bg-muted/30">
                      <TableCell className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Q{question.questionNumber || question.id}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {truncateText(question.questionText)}
                          </p>
                          {question.topic && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {question.topic}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {question.subject}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {getDifficultyBadge(question.difficulty)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(question.isVerified, question.aiConfidence)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {Math.round((question.aiConfidence || 0) * 100)}%
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground">
                            {question.aiModelAnswer ? truncateText(question.aiModelAnswer, 80) : "Not generated"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewQuestion(question)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditQuestion(question.id, question)}
                          className="text-primary hover:text-blue-700 hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerifyQuestion(question.id, !question.isVerified)}
                          className={
                            question.isVerified
                              ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow/10"
                              : "text-secondary hover:text-green-700 hover:bg-secondary/10"
                          }
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteQuestion(question.id)}
                          className="text-destructive hover:text-red-700 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} questions
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
