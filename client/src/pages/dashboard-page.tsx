import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProgressCard from "@/components/dashboard/ProgressCard";
import ProgressRing from "@/components/dashboard/ProgressRing";
import DomainProgressBar from "@/components/dashboard/DomainProgressBar";
import ActivityItem from "@/components/dashboard/ActivityItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, FileSliders, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [user?.tenantId ? `/api/tenant/${user.tenantId}/dashboard` : null],
    enabled: !!user?.tenantId,
  });

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome to your Identity Governance Platform</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : dashboardData ? (
          <>
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Overall Completion */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Overall Completion</h3>
                      <p className="text-3xl font-bold text-slate-800">{dashboardData.progress.overallCompletion}%</p>
                    </div>
                    <ProgressRing 
                      progress={dashboardData.progress.overallCompletion} 
                      size={64} 
                      strokeWidth={4} 
                    />
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="text-green-600 font-medium">+12%</span> since last week
                  </p>
                </CardContent>
              </Card>
              
              {/* Domains Covered */}
              <ProgressCard
                title="Domains Covered"
                value={`${dashboardData.progress.domainProgress.filter(d => d.answered > 0).length}/${dashboardData.progress.domainProgress.length}`}
                icon={<FileSliders className="h-5 w-5 text-blue-600" />}
                progressPercentage={(dashboardData.progress.domainProgress.filter(d => d.answered > 0).length / dashboardData.progress.domainProgress.length) * 100}
                description="Progress across question domains"
              />
              
              {/* Questions Answered */}
              <ProgressCard
                title="Questions Answered"
                value={`${dashboardData.progress.answered}/${dashboardData.progress.totalQuestions}`}
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                progressPercentage={(dashboardData.progress.answered / dashboardData.progress.totalQuestions) * 100}
                description="Questionnaire progress by count"
              />
            </div>
            
            {/* Domain Progress */}
            <Card className="shadow-sm mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-slate-800">Domain Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.progress.domainProgress.map((domain, index) => (
                    <DomainProgressBar 
                      key={index}
                      domainName={domain.domain.name}
                      progress={domain.progress}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity & Action Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-slate-800">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[320px]">
                    <ul className="space-y-3 p-4">
                      {dashboardData.recentActivities.map((activity, index) => (
                        <ActivityItem 
                          key={index}
                          activity={activity}
                        />
                      ))}
                      {dashboardData.recentActivities.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                          <AlertCircle className="mx-auto h-8 w-8 mb-2 text-slate-400" />
                          <p>No recent activities</p>
                        </div>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Action Items */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-slate-800">Action Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[320px]">
                    <ul className="divide-y divide-slate-200 p-4">
                      {dashboardData.progress.domainProgress.flatMap(domain => {
                        if (domain.total - domain.answered > 0) {
                          return [{
                            domain: domain.domain.name,
                            remaining: domain.total - domain.answered
                          }];
                        }
                        return [];
                      }).map((item, index) => (
                        <li key={index} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center">
                            <Checkbox id={`task-${index}`} />
                            <div className="ml-3 flex-1">
                              <label 
                                htmlFor={`task-${index}`}
                                className="text-sm font-medium text-slate-800 cursor-pointer"
                              >
                                Complete "{item.domain}" questions
                              </label>
                              <p className="text-xs text-slate-500">{item.remaining} questions remaining</p>
                            </div>
                            <span className="material-icons text-slate-400 text-lg">chevron_right</span>
                          </div>
                        </li>
                      ))}
                      {dashboardData.progress.domainProgress.every(domain => domain.answered === domain.total) && (
                        <div className="text-center text-slate-500 py-10">
                          <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500" />
                          <p>All questions answered!</p>
                        </div>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No data available</h3>
            <p className="text-slate-500">There is no questionnaire data for your tenant yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
