import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Brain, BookOpen, Users, Award } from "lucide-react";

export default function Login() {
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminCredentials),
      });

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back, Admin!",
        });
        window.location.href = "/admin";
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-8">
        {/* Left side - Hero Section */}
        <div className="hidden lg:flex flex-col items-start space-y-6 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary rounded-lg">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                IntelliTutor
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                AI-Powered Learning Platform
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-gray-700 dark:text-gray-300">
                Automated question extraction from NESA exam papers
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-gray-700 dark:text-gray-300">
                AI-powered answer evaluation and feedback
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-gray-700 dark:text-gray-300">
                Personalized learning recommendations
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-gray-700 dark:text-gray-300">
                Progress tracking and achievement badges
              </span>
            </div>
          </div>


        </div>

        {/* Right side - Login Forms */}
        <div className="w-full max-w-md">
          <Card className="elevation-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <p className="text-muted-foreground">
                Choose your login method to continue
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="student">Student</TabsTrigger>
                  <TabsTrigger value="admin">Administrator</TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sign in with your Google account to access your learning dashboard
                    </p>
                    
                    <Button
                      onClick={handleGoogleLogin}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center space-x-2"
                      size="lg"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </Button>

                    <div className="text-xs text-center text-muted-foreground">
                      By signing in, you agree to our Terms of Service and Privacy Policy
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={adminCredentials.username}
                        onChange={(e) =>
                          setAdminCredentials({ ...adminCredentials, username: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={adminCredentials.password}
                        onChange={(e) =>
                          setAdminCredentials({ ...adminCredentials, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In as Administrator"}
                    </Button>
                  </form>

                  <div className="text-xs text-center text-muted-foreground">
                    Administrator access is required to manage questions and view analytics
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  New to IntelliTutor?{" "}
                  <span className="text-primary font-semibold">
                    Students automatically get an account when signing in with Google
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}