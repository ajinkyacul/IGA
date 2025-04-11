import { useEffect } from "react";
import { useLocation } from "wouter";
import DashboardPage from "./dashboard-page";

export default function HomePage() {
  const [, navigate] = useLocation();
  
  // Simply redirect to dashboard
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  
  // Return the dashboard component directly
  return <DashboardPage />;
}
