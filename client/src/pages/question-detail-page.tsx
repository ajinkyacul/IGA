import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ResponseThread from "@/components/questionnaire/ResponseThread";
import ResponseInput from "@/components/questionnaire/ResponseInput";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, ChevronRight } from "lucide-react";

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const questionId = parseInt(id);

  // Fetch tenant questions to get the one we're viewing
  const { data: tenantQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: [user?.tenantId ? `/api/tenant/${user.tenantId}/questions` : null],
    enabled: !!user?.tenantId,
  });

  // Find the specific tenant question
  const tenantQuestion = tenantQuestions?.find(tq => tq.id === questionId);

  // Fetch responses for this question
  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: [tenantQuestion ? `/api/tenant-questions/${tenantQuestion.id}/responses` : null],
    enabled: !!tenantQuestion,
  });

  // Redirect if question not found after loading
  useEffect(() => {
    if (!questionsLoading && tenantQuestions && !tenantQuestion) {
      navigate("/questionnaires");
    }
  }, [questionsLoading, tenantQuestions, tenantQuestion, navigate]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Answered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Answered</Badge>;
      case "In Progress":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">In Progress</Badge>;
      case "Unanswered":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Unanswered</Badge>;
      default:
        return null;
    }
  };

  const isLoading = questionsLoading || (tenantQuestion && responsesLoading);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tenantQuestion) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Question not found</h3>
            <p className="text-slate-500 mb-4">The question you're looking for doesn't exist or you don't have access to it.</p>
            <a href="/questionnaires" className="text-primary hover:underline">
              Back to Questionnaires
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const question = tenantQuestion.question;
  const domain = tenantQuestion.domain;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Breadcrumbs */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-slate-500">
            <li>
              <a href="/questionnaires" className="hover:text-primary">Questionnaires</a>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4" />
              <a href={`/domain/${domain.id}`} className="hover:text-primary ml-1">{domain.name}</a>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4" />
              <span className="ml-1">Question Detail</span>
            </li>
          </ol>
        </nav>
        
        {/* Question Card */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-800">
                {question.title}
              </h1>
              {getStatusBadge(tenantQuestion.status)}
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {question.description}
            </p>
            
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {tag}
                  </Badge>
                ))}
                {question.required && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-800 hover:bg-slate-100">
                    Required
                  </Badge>
                )}
              </div>
            )}
            
            <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 flex space-x-2">
              <span>Last updated: {formatDate(tenantQuestion.lastUpdated)}</span>
              <span>•</span>
              <span>{responses?.length || 0} responses</span>
              <span>•</span>
              <span>
                {responses?.reduce((count, response) => 
                  count + (response.attachments?.length || 0), 0) || 0} files
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Response Thread */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-medium text-slate-800">Responses</h2>
            </div>
            
            <ResponseThread 
              responses={responses || []}
              isLoading={responsesLoading}
            />
            
            {/* Response Input */}
            <ResponseInput tenantQuestionId={tenantQuestion.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
