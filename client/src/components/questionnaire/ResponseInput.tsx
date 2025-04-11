import { useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Paperclip,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResponseInputProps {
  tenantQuestionId: number;
}

export default function ResponseInput({ tenantQuestionId }: ResponseInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get initials for avatar
  const getInitials = (name: string = 'User') => {
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Get avatar background color based on user role
  const getAvatarColor = (role: string = 'Customer') => {
    switch(role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-600';
      case 'Consultant':
        return 'bg-emerald-100 text-emerald-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Format text based on button pressed
  const formatText = (formatType: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let newCursorPosition = 0;
    
    switch(formatType) {
      case 'bold':
        formattedText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        newCursorPosition = end + 4;
        break;
      case 'italic':
        formattedText = content.substring(0, start) + `_${selectedText}_` + content.substring(end);
        newCursorPosition = end + 2;
        break;
      case 'bullet':
        formattedText = content.substring(0, start) + `\n- ${selectedText}` + content.substring(end);
        newCursorPosition = end + 3;
        break;
      case 'numbered':
        formattedText = content.substring(0, start) + `\n1. ${selectedText}` + content.substring(end);
        newCursorPosition = end + 4;
        break;
      default:
        return;
    }
    
    setContent(formattedText);
    
    // Set focus and cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async (responseContent: string) => {
      const res = await apiRequest(
        "POST", 
        `/api/tenant-questions/${tenantQuestionId}/responses`,
        { content: responseContent }
      );
      return await res.json();
    },
    onSuccess: (newResponse) => {
      // Clear input
      setContent("");
      setSelectedFile(null);
      
      // Update the cache
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenant-questions/${tenantQuestionId}/responses`] 
      });
      
      // If there's a file, upload it
      if (selectedFile) {
        uploadFileMutation.mutate({
          responseId: newResponse.id,
          file: selectedFile
        });
      } else {
        toast({
          title: "Response added",
          description: "Your response has been posted successfully."
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post response",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ responseId, file }: { responseId: number, file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`/api/responses/${responseId}/attachments`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response with attachment added",
        description: "Your response and file have been posted successfully."
      });
      
      // Update the cache to reflect the new attachment
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenant-questions/${tenantQuestionId}/responses`] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload file",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Submit response handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Cannot submit empty response",
        description: "Please enter a response before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    submitResponseMutation.mutate(content);
  };

  const isLoading = submitResponseMutation.isPending || uploadFileMutation.isPending;

  return (
    <div className="p-6 border-t border-slate-200">
      <div className="flex items-start">
        <Avatar className={`w-10 h-10 mr-4 ${getAvatarColor(user?.role)}`}>
          <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit}>
            <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <div className="px-3 py-2 bg-white">
                <textarea 
                  rows={3} 
                  className="w-full outline-none text-sm resize-none" 
                  placeholder="Add your response..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading}
                ></textarea>
              </div>
              
              {selectedFile && (
                <div className="px-3 py-2 bg-slate-100 border-t border-slate-200">
                  <div className="flex items-center">
                    <Paperclip className="h-4 w-4 text-slate-500 mr-2" />
                    <span className="text-xs text-slate-700">{selectedFile.name}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto h-6 text-xs"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="px-3 py-2 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => formatText('bold')}
                    disabled={isLoading}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => formatText('italic')}
                    disabled={isLoading}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => formatText('bullet')}
                    disabled={isLoading}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => formatText('numbered')}
                    disabled={isLoading}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleFileSelect}
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                </div>
                <div>
                  <Button 
                    type="submit" 
                    className="bg-primary text-white px-4 py-1.5 text-sm font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : "Post Response"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
