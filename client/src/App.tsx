import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Practice from "@/pages/practice";
import Admin from "@/pages/admin";
import AdminStudents from "@/pages/admin-students";
import Progress from "@/pages/progress";
import { PWAUpdateNotification } from "@/components/PWAInstallButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/practice" component={Practice} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/students" component={AdminStudents} />
          <Route path="/progress" component={Progress} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <PWAUpdateNotification />
        <OfflineIndicator />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
