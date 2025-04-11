import { Link } from "wouter";
import { MessageSquare, Paperclip, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface QuestionCardProps {
  id: number;
  title: string;
  description: string;
  status: "Answered" | "In Progress" | "Unanswered";
  responseCount: number;
  attachmentCount: number;
  lastUpdated: string;
}

export default function QuestionCard({
  id,
  title,
  description,
  status,
  responseCount,
  attachmentCount,
  lastUpdated
}: QuestionCardProps) {
  // Status badge styling
  const statusConfig = {
    "Answered": { color: "bg-green-100 text-green-800", label: "Answered" },
    "In Progress": { color: "bg-amber-100 text-amber-800", label: "In Progress" },
    "Unanswered": { color: "bg-red-100 text-red-800", label: "Unanswered" }
  };
  
  const { color, label } = statusConfig[status];
  
  return (
    <Link href={`/question/${id}`}>
      <a className="block hover:bg-slate-50 transition-colors duration-150">
        <Card className="border-0 shadow-none hover:bg-slate-50">
          <CardContent className="p-4 sm:px-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-800">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {description}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                <Badge variant="outline" className={`px-2 py-1 text-xs rounded-full ${color}`}>
                  {label}
                </Badge>
                <span className="mt-1 text-xs text-slate-500">
                  {lastUpdated ? `Last updated: ${lastUpdated}` : "Not yet answered"}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <span className="flex items-center">
                <MessageSquare className="h-3.5 w-3.5 mr-1 text-slate-400" />
                {responseCount} responses
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <Paperclip className="h-3.5 w-3.5 mr-1 text-slate-400" />
                {attachmentCount} files
              </span>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
