import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface User {
  id: number;
  fullName: string;
  role: string;
}

interface Response {
  id: number;
  content: string;
  user: User;
  createdAt: string;
  attachments: Attachment[];
}

interface ResponseThreadProps {
  responses: Response[];
  isLoading: boolean;
}

export default function ResponseThread({ responses, isLoading }: ResponseThreadProps) {
  // Function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Function to determine avatar background color based on user role
  const getAvatarColor = (role: string) => {
    switch(role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-600';
      case 'Consultant':
        return 'bg-emerald-100 text-emerald-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Function to handle file download
  const handleDownload = (attachmentId: number) => {
    window.open(`/api/attachments/${attachmentId}`, '_blank');
  };

  // Function to render file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <span className="text-blue-500">🖼️</span>;
    } else if (mimeType === 'application/pdf') {
      return <span className="text-red-500">📄</span>;
    } else if (mimeType.includes('word')) {
      return <span className="text-blue-700">📝</span>;
    } else {
      return <span className="text-gray-500">📎</span>;
    }
  };

  // Format file size
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading responses...</div>;
  }

  if (responses.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No responses yet. Be the first to respond to this question.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="divide-y divide-slate-200">
        {responses.map((response, index) => (
          <div key={response.id} className={index % 2 === 1 ? "p-6 bg-slate-50" : "p-6"}>
            <div className="flex items-start">
              <Avatar className={`w-10 h-10 mr-4 ${getAvatarColor(response.user.role)}`}>
                <AvatarFallback>{getInitials(response.user.fullName)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">{response.user.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      {response.user.role} • {formatDate(response.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Copy Link</DropdownMenuItem>
                        <DropdownMenuItem>Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none text-slate-700">
                  {/* Parse content as HTML - in a real app, you'd use a markdown renderer */}
                  <div dangerouslySetInnerHTML={{ __html: response.content.replace(/\n/g, '<br/>') }} />
                </div>
                
                {/* Attachments */}
                {response.attachments && response.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {response.attachments.map(attachment => (
                      <div 
                        key={attachment.id} 
                        className="border border-slate-200 rounded-md p-2 flex items-center bg-slate-50"
                      >
                        <div className="mr-2">{getFileIcon(attachment.mimeType)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {attachment.originalName}
                          </p>
                          <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-2 h-6 w-6"
                          onClick={() => handleDownload(attachment.id)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
