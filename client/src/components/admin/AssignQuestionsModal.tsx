import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, FileCheck, HelpCircle } from "lucide-react";

interface AssignQuestionsModalProps {
  tenantId: number;
  onSuccess?: () => void;
}

export default function AssignQuestionsModal({
  tenantId,
  onSuccess
}: AssignQuestionsModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  
  // Fetch all questions
  const { data: allQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/questions"],
  });
  
  // Fetch domains for categorization
  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/domains"],
  });
  
  // Fetch tenant questions to know which ones are already assigned
  const { data: tenantQuestions, isLoading: tenantQuestionsLoading } = useQuery({
    queryKey: [`/api/tenant/${tenantId}/questions`],
  });
  
  // Get list of already assigned question IDs
  const assignedQuestionIds = tenantQuestions 
    ? tenantQuestions.map((tq: any) => tq.questionId) 
    : [];
  
  // Filter questions based on search and exclude already assigned ones
  const filteredQuestions = allQuestions?.filter((question: any) => {
    const matchesSearch = !searchQuery || 
      question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.description && question.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const isNotAssigned = !assignedQuestionIds.includes(question.id);
    
    return matchesSearch && isNotAssigned;
  });
  
  // Group questions by domain for the categorized view
  const questionsByDomain = domains?.map(domain => {
    const domainQuestions = filteredQuestions?.filter(
      (q: any) => q.domainId === domain.id
    ) || [];
    
    return {
      domain,
      questions: domainQuestions
    };
  }).filter(group => group.questions.length > 0);
  
  // Assign questions mutation
  const assignQuestionsMutation = useMutation({
    mutationFn: async (questionIds: number[]) => {
      // Create an array of promises for each question to assign
      const assignPromises = questionIds.map(questionId => 
        apiRequest("POST", "/api/admin/tenant-questions", {
          tenantId,
          questionId,
          status: "Unanswered"
        })
      );
      
      // Wait for all assignments to complete
      await Promise.all(assignPromises);
    },
    onSuccess: () => {
      toast({
        title: "Questions assigned",
        description: `${selectedQuestionIds.length} questions have been assigned to the tenant.`,
      });
      
      // Reset selected questions
      setSelectedQuestionIds([]);
      
      // Refresh tenant questions
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenant/${tenantId}/questions`] 
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error assigning questions",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Toggle question selection
  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };
  
  // Handle assign button click
  const handleAssignQuestions = () => {
    if (selectedQuestionIds.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question to assign.",
        variant: "destructive",
      });
      return;
    }
    
    assignQuestionsMutation.mutate(selectedQuestionIds);
  };
  
  const isLoading = questionsLoading || domainsLoading || tenantQuestionsLoading;
  
  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          type="text"
          className="pl-10"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All Questions</TabsTrigger>
              <TabsTrigger value="categorized" className="flex-1">By Domain</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {filteredQuestions?.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No unassigned questions match your search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredQuestions?.map((question: any) => (
                      <div
                        key={question.id}
                        className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-md"
                      >
                        <Checkbox
                          id={`q-${question.id}`}
                          checked={selectedQuestionIds.includes(question.id)}
                          onCheckedChange={() => toggleQuestionSelection(question.id)}
                        />
                        <div>
                          <label
                            htmlFor={`q-${question.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {question.title}
                          </label>
                          <p className="text-xs text-slate-500">{question.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Domain: {domains?.find((d: any) => d.id === question.domainId)?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="categorized">
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {questionsByDomain?.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No unassigned questions match your search</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questionsByDomain?.map(({ domain, questions }) => (
                      <div key={domain.id} className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-1">
                          {domain.name}
                        </h3>
                        
                        {questions.map((question: any) => (
                          <div
                            key={question.id}
                            className="flex items-start space-x-3 pl-2 p-2 hover:bg-slate-50 rounded-md"
                          >
                            <Checkbox
                              id={`qc-${question.id}`}
                              checked={selectedQuestionIds.includes(question.id)}
                              onCheckedChange={() => toggleQuestionSelection(question.id)}
                            />
                            <div>
                              <label
                                htmlFor={`qc-${question.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {question.title}
                              </label>
                              <p className="text-xs text-slate-500">{question.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-500">
              {selectedQuestionIds.length} question{selectedQuestionIds.length !== 1 ? 's' : ''} selected
            </p>
            
            <Button 
              className="flex items-center"
              onClick={handleAssignQuestions}
              disabled={selectedQuestionIds.length === 0 || assignQuestionsMutation.isPending}
            >
              {assignQuestionsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Questions
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
