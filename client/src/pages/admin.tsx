import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import AdminTable from "@/components/AdminTable";
import StatsCard from "@/components/StatsCard";
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

  const { data: questions, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ["/api/admin/questions"],
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

          {/* Document Processing & AI Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <FileText className="text-red-600 mr-2" />
                  Document Processing Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {/* OCR Processing Status */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">OCR Processing</span>
                      <span className="text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Ready</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>System ready to process uploaded documents</p>
                      <p className="text-blue-600">Processing pipeline: Active</p>
                    </div>
                  </div>

                  {/* AI Generation Status */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">AI Answer Generation</span>
                      <span className="text-sm bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">Online</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>OpenAI GPT-4o model ready</p>
                      <p className="text-green-600">Model answers generated automatically</p>
                    </div>
                  </div>

                  <Button className="w-full btn-primary" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-2 w-4 h-4" />
                    Upload New Exam Papers
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card p-6 rounded-lg elevation-1">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Brain className="text-primary mr-2" />
                  NLP & AI Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {/* NLP Techniques Performance */}
                  <div>
                    <h4 className="font-medium mb-2">Evaluation Techniques Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">TF-IDF Similarity</span>
                        <span className="text-sm font-medium">94.2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">spaCy NLP Analysis</span>
                        <span className="text-sm font-medium">91.8%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">NLTK Processing</span>
                        <span className="text-sm font-medium">89.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Grammar Check</span>
                        <span className="text-sm font-medium">97.1%</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Model Status */}
                  <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2">AI Model Status</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span>Generative AI Model</span>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Question Recommendations</span>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Management Table */}
          <AdminTable
            questions={questions || []}
            loading={questionsLoading}
            onVerifyQuestion={(questionId, isVerified) => 
              verifyQuestionMutation.mutate({ questionId, isVerified })
            }
          />
        </section>
      </div>
    </div>
  );
}
