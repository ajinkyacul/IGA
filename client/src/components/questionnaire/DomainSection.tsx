import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import QuestionCard from "@/components/questionnaire/QuestionCard";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

interface DomainProps {
  domain: {
    id: number;
    name: string;
    icon?: string;
  };
  questions: any[];
}

export default function DomainSection({ domain, questions }: DomainProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Sort questions: "Unanswered" first, then "In Progress", finally "Answered"
  const sortedQuestions = [...questions].sort((a, b) => {
    const statusOrder = { "Unanswered": 0, "In Progress": 1, "Answered": 2 };
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
  });
  
  // Display only first 3 questions unless showAll is true
  const displayedQuestions = showAll ? sortedQuestions : sortedQuestions.slice(0, 3);
  
  // Calculate completion
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === "Answered").length;

  // Format date relative to now
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get domain icon
  const getDomainIcon = () => {
    switch(domain.name) {
      case "Access Reviews":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case "Generic Governance Questions":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>;
      case "Application Onboarding":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>;
      case "Segregation of Duties (SOD)":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>;
      case "AD/Directory Services":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {getDomainIcon()}
            <h2 className="text-lg font-medium text-slate-800 ml-2">{domain.name}</h2>
          </div>
          <div className="flex items-center text-sm text-slate-500">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span>{answeredQuestions}/{totalQuestions} Completed</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-200">
          {displayedQuestions.map((question) => (
            <li key={question.id}>
              <QuestionCard
                id={question.id}
                title={question.question.title}
                description={question.question.description || ""}
                status={question.status}
                responseCount={question.responseCount || 0}
                attachmentCount={0} // We don't have this info directly, would need a separate API call
                lastUpdated={formatRelativeTime(question.lastUpdated)}
              />
            </li>
          ))}
          
          {questions.length > 3 && (
            <li className="p-4 text-center">
              <Button
                variant="ghost"
                className="text-primary hover:text-primary-900 font-medium"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <span className="flex items-center">
                    Show less <ChevronUp className="ml-1 h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    View all {questions.length} questions in this domain <ChevronDown className="ml-1 h-4 w-4" />
                  </span>
                )}
              </Button>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
