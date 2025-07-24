import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import AdminTable from "@/components/AdminTable";
import StatsCard from "@/components/StatsCard";
import EditQuestionDialog from "@/components/EditQuestionDialog";
import ViewQuestionDialog from "@/components/ViewQuestionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Settings, MessageCircleQuestion, Users, Brain, Clock, FileText, CheckCircle } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    subject: "",
    year: new Date().getFullYear().toString(),
    level: "",
    file: null as File | null
  });

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: questionsData, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ["/api/admin/questions", currentPage, pageSize, searchTerm, subjectFilter, verificationFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (subjectFilter !== 'all') params.append('subject', subjectFilter);
      if (verificationFilter !== 'all') params.append('verified', verificationFilter === 'verified' ? 'true' : 'false');
      
      const response = await apiRequest("GET", `/api/admin/questions?${params.toString()}`);
      return response.json();
    },
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const uploadPaperMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/upload-paper", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Exam paper uploaded successfully! Processing ${data.examPaperId}...`,
      });
      setUploadDialogOpen(false);
      setUploadForm({
        title: "",
        subject: "",
        year: new Date().getFullYear().toString(),
        level: "",
        file: null
      });
      // Refetch questions after successful upload
      setTimeout(() => {
        refetchQuestions();
      }, 2000);
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
        description: error.message || "Failed to upload exam paper",
        variant: "destructive",
      });
    },
  });

  const verifyQuestionMutation = useMutation({
    mutationFn: async ({ questionId, isVerified }: { questionId: number; isVerified: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/questions/${questionId}/verify`, {
        isVerified
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question verification updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update question verification",
        variant: "destructive",
      });
    },
  });

  const editQuestionMutation = useMutation({
    mutationFn: async ({ questionId, updates }: { questionId: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/admin/questions/${questionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/questions/${questionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Question deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  const handleEditQuestion = (questionId: number, question: any) => {
    setEditingQuestion(question);
    setEditDialogOpen(true);
  };

  const handleViewQuestion = (question: any) => {
    setViewingQuestion(question);
    setViewDialogOpen(true);
  };

  const handleSaveQuestion = (questionId: number, updates: any) => {
    editQuestionMutation.mutate({ questionId, updates });
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.title || !uploadForm.subject || !uploadForm.level) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("examPaper", uploadForm.file);
    formData.append("title", uploadForm.title);
    formData.append("subject", uploadForm.subject);
    formData.append("year", uploadForm.year);
    formData.append("level", uploadForm.level);

    uploadPaperMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <div className="flex space-x-3">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Upload className="mr-2 w-4 h-4" />
                    Upload Exam Papers
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Exam Paper</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Paper Title</Label>
                      <Input
                        id="title"
                        type="text"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Computer Science Advanced Level 2024"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={uploadForm.subject} onValueChange={(value) => setUploadForm(prev => ({ ...prev, subject: value }))}>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={uploadForm.year}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value }))}
                          min="2000"
                          max="2030"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="level">Level</Label>
                        <Select value={uploadForm.level} onValueChange={(value) => setUploadForm(prev => ({ ...prev, level: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="O-Level">O-Level</SelectItem>
                            <SelectItem value="A-Level">A-Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="file">Exam Paper (PDF/Image)</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp"
                        onChange={handleFileChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum file size: 10MB. Supported formats: PDF, JPG, PNG
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadPaperMutation.isPending}>
                        {uploadPaperMutation.isPending ? (
                          <>
                            <div className="spinner mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 w-4 h-4" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="btn-outline">
                <Settings className="mr-2 w-4 h-4" />
                AI Settings
              </Button>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={MessageCircleQuestion}
              iconColor="text-primary"
              iconBg="bg-blue-100 dark:bg-blue-900"
              title="Total Questions"
              value={statsLoading ? "..." : stats?.totalQuestions?.toString() || "0"}
            />
            <StatsCard
              icon={Users}
              iconColor="text-secondary"
              iconBg="bg-green-100 dark:bg-green-900"
              title="Active Students"
              value={statsLoading ? "..." : stats?.totalStudents?.toString() || "0"}
            />
            <StatsCard
              icon={Brain}
              iconColor="text-accent"
              iconBg="bg-orange-100 dark:bg-orange-900"
              title="AI Accuracy"
              value={statsLoading ? "..." : `${stats?.aiAccuracy || 0}%`}
            />
            <StatsCard
              icon={Clock}
              iconColor="text-red-600"
              iconBg="bg-red-100 dark:bg-red-900"
              title="Pending Reviews"
              value={statsLoading ? "..." : stats?.pendingReviews?.toString() || "0"}
            />
          </div>



          {/* Question Management Table */}
          <AdminTable
            questions={questionsData?.questions || []}
            loading={questionsLoading}
            total={questionsData?.total || 0}
            page={currentPage}
            pageSize={pageSize}
            searchTerm={searchTerm}
            subjectFilter={subjectFilter}
            verificationFilter={verificationFilter}
            onVerifyQuestion={(questionId, isVerified) => 
              verifyQuestionMutation.mutate({ questionId, isVerified })
            }
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onViewQuestion={handleViewQuestion}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={setSearchTerm}
            onSubjectFilterChange={setSubjectFilter}
            onVerificationFilterChange={setVerificationFilter}
          />

          {/* Edit Question Dialog */}
          <EditQuestionDialog
            question={editingQuestion}
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setEditingQuestion(null);
            }}
            onSave={handleSaveQuestion}
            isLoading={editQuestionMutation.isPending}
          />

          {/* View Question Dialog */}
          <ViewQuestionDialog
            question={viewingQuestion}
            isOpen={viewDialogOpen}
            onClose={() => {
              setViewDialogOpen(false);
              setViewingQuestion(null);
            }}
          />
        </section>
      </div>
    </div>
  );
}
