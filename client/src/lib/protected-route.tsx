import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: string[];
};

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check if role is required and user has the required role
        if (requiredRole && !requiredRole.includes(user.role)) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
              <p className="text-slate-600 mb-4 text-center">
                You don't have permission to access this page. This area requires {requiredRole.join(" or ")} privileges.
              </p>
              <a href="/" className="text-primary hover:underline">
                Return to Dashboard
              </a>
            </div>
          );
        }

        return <Component />;
      }}
    </Route>
  );
}
