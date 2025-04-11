import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect to dashboard if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="flex w-full max-w-6xl overflow-hidden rounded-lg shadow-lg">
        {/* Left Side - Auth Forms */}
        <Card className="flex-1 p-6">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <div className="bg-primary p-2 rounded text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <h1 className="ml-2 text-2xl font-bold text-slate-800">IdGov Platform</h1>
              </div>
            </div>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm />
                <div className="mt-4 text-center text-sm text-slate-600">
                  <p>Don't have an account?{" "}
                    <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                      Create one
                    </Button>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm />
                <div className="mt-4 text-center text-sm text-slate-600">
                  <p>Already have an account?{" "}
                    <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                      Sign in
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Right Side - Hero Section */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="p-12 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-6">
              Identity Governance Requirements Platform
            </h2>
            <p className="text-lg mb-8 text-blue-100">
              Centralize, organize, and streamline your identity governance requirements gathering process.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure & Tenant-Aware</h3>
                  <p className="text-sm text-blue-100">Each customer sees only their company data with robust access controls</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Threaded Responses</h3>
                  <p className="text-sm text-blue-100">Chat-style responses with file attachments for each question</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Organized by Domain</h3>
                  <p className="text-sm text-blue-100">Questions categorized into domains for easy navigation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
