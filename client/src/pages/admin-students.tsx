import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Users, GraduationCap, Clock, Trophy, TrendingUp, BookOpen } from "lucide-react";
import { format } from "date-fns";
import type { StudentPerformance } from "@shared/types";

export default function AdminStudents() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: students = [], isLoading, error } = useQuery<StudentPerformance[]>({
    queryKey: ["/api/admin/students"],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (error && isUnauthorizedError(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required to view student data.</p>
        </div>
      </div>
    );
  }

  // Filter and sort students
  const filteredStudents = students
    .filter(student => 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy as keyof StudentPerformance] || 0;
      const bValue = b[sortBy as keyof StudentPerformance] || 0;
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/students/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `students_performance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900";
    if (score >= 60) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900";
    return "text-red-600 bg-red-100 dark:bg-red-900";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Advanced": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Intermediate": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Student Management</h2>
              <p className="text-muted-foreground">View and manage all student performance data</p>
            </div>
            <Button onClick={handleExportCSV} className="btn-primary">
              <Download className="mr-2 w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                    <p className="text-2xl font-bold">
                      {students.length > 0 
                        ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Questions Completed</p>
                    <p className="text-2xl font-bold">
                      {students.reduce((sum, s) => sum + s.questionsCompleted, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Study Time</p>
                    <p className="text-2xl font-bold">
                      {Math.round(students.reduce((sum, s) => sum + s.timeSpent, 0) / 60)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="averageScore">Performance</SelectItem>
                  <SelectItem value="questionsCompleted">Questions Completed</SelectItem>
                  <SelectItem value="timeSpent">Study Time</SelectItem>
                  <SelectItem value="studyStreak">Study Streak</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 w-5 h-5" />
              Students Performance Data ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Study Time</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead>Strong/Weak</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {student.profileImageUrl && (
                            <img 
                              src={student.profileImageUrl} 
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(student.currentLevel)}>
                          {student.currentLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPerformanceColor(student.averageScore)}>
                          {student.averageScore}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{student.questionsCompleted}</TableCell>
                      <TableCell>{student.timeSpent}min</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
                          {student.studyStreak}
                        </div>
                      </TableCell>
                      <TableCell>{student.badgeCount}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.strongSubjects.length > 0 && (
                            <div className="text-sm">
                              <span className="text-green-600">Strong: </span>
                              {student.strongSubjects.slice(0, 2).join(", ")}
                            </div>
                          )}
                          {student.weakSubjects.length > 0 && (
                            <div className="text-sm">
                              <span className="text-red-600">Weak: </span>
                              {student.weakSubjects.slice(0, 2).join(", ")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(student.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(student.lastLogin), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No students found matching your search." : "No students registered yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}