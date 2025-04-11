import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import QuestionnairesPage from "@/pages/questionnaires-page";
import QuestionDetailPage from "@/pages/question-detail-page";
import TenantManagementPage from "@/pages/admin/tenant-management";
import QuestionManagementPage from "@/pages/admin/question-management";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/questionnaires" component={QuestionnairesPage} />
      <ProtectedRoute path="/question/:id" component={QuestionDetailPage} />
      <ProtectedRoute 
        path="/admin/tenants" 
        component={TenantManagementPage} 
        requiredRole={["Admin"]} 
      />
      <ProtectedRoute 
        path="/admin/questions" 
        component={QuestionManagementPage} 
        requiredRole={["Admin"]} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
