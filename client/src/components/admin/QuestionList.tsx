import { useState } from "react";
import { Loader2, MoreVertical, Pencil, Trash2, HelpCircle, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuestionListProps {
  questions: any[];
  domains: any[];
  isLoading: boolean;
  onQuestionEdit: (question: any) => void;
}

export default function QuestionList({
  questions,
  domains,
  isLoading,
  onQuestionEdit
}: QuestionListProps) {
  const { toast } = useToast();
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest("DELETE", `/api/admin/questions/${questionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });
      
      // Refresh question list
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      
      // Reset deleting state
      setDeletingQuestionId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting question",
        description: error.message,
        variant: "destructive",
      });
      setDeletingQuestionId(null);
    }
  });

  // Handle question deletion
  const handleDeleteQuestion = (questionId: number) => {
    deleteQuestionMutation.mutate(questionId);
  };

  // Get domain name by id
  const getDomainName = (domainId: number) => {
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.name : "Unknown Domain";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-6">
        <FileQuestion className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">No questions available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-400px)]">
      <div className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center mb-1">
                  <HelpCircle className="h-4 w-4 text-primary mr-2" />
                  <h3 className="font-medium text-slate-800">{question.title}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  {question.description || "No description provided"}
                </p>
                
                <div className="flex flex-wrap items-center text-xs gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    {getDomainName(question.domainId)}
                  </Badge>
                  
                  {question.required && (
                    <Badge variant="outline" className="bg-red-50">
                      Required
                    </Badge>
                  )}
                  
                  {question.tags && question.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-slate-100">
                      {tag}
                    </Badge>
                  ))}
                  
                  <span className="text-slate-400">
                    Updated: {formatDate(question.updatedAt)}
                  </span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onQuestionEdit(question)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  
                  <AlertDialog open={deletingQuestionId === question.id} onOpenChange={(open) => !open && setDeletingQuestionId(null)}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onSelect={(e) => {
                          e.preventDefault();
                          setDeletingQuestionId(question.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the question "{question.title}" and all associated responses.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          {deleteQuestionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : "Delete Question"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
