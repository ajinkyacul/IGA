import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuestionList from "@/components/admin/QuestionList";
import QuestionForm from "@/components/admin/QuestionForm";
import ExcelUploader from "@/components/admin/ExcelUploader";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileSpreadsheet, Plus, Search, FilterX } from "lucide-react";

export default function QuestionManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [isCreateQuestionDialogOpen, setIsCreateQuestionDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Fetch questions and domains
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/questions"],
  });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/domains"],
  });

  // Filter questions based on search and domain
  const filteredQuestions = questions?.filter((question: any) => {
    const matchesSearch = !searchQuery || 
      question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.description && question.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDomain = !domainFilter || domainFilter === "all-domains" || question.domainId.toString() === domainFilter;
    
    return matchesSearch && matchesDomain;
  });

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setDomainFilter("all-domains");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || (domainFilter && domainFilter !== "all-domains");

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Question Management</h1>
            <p className="text-sm text-slate-500">Create and manage questions for tenant questionnaires</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Import from Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Questions from Excel</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file to bulk import questions
                  </DialogDescription>
                </DialogHeader>
                <ExcelUploader 
                  domains={domains || []} 
                  onSuccess={() => setIsImportDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateQuestionDialogOpen} onOpenChange={setIsCreateQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Question</DialogTitle>
                  <DialogDescription>
                    Add a new question to the question pool.
                  </DialogDescription>
                </DialogHeader>
                <QuestionForm 
                  onSuccess={() => setIsCreateQuestionDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-domains">All Domains</SelectItem>
                  {domains?.map((domain: any) => (
                    <SelectItem key={domain.id} value={domain.id.toString()}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  className="md:self-start"
                  onClick={resetFilters}
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
          {hasActiveFilters && (
            <CardFooter className="pt-0 border-t">
              <p className="text-sm text-slate-500">
                Showing {filteredQuestions?.length || 0} of {questions?.length || 0} questions
              </p>
            </CardFooter>
          )}
        </Card>

        <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Update question details.
              </DialogDescription>
            </DialogHeader>
            {editingQuestion && (
              <QuestionForm 
                question={editingQuestion} 
                onSuccess={() => setEditingQuestion(null)} 
              />
            )}
          </DialogContent>
        </Dialog>

        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Questions</CardTitle>
            <CardDescription>
              Manage questions across all domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionList 
              questions={filteredQuestions || []} 
              domains={domains || []}
              isLoading={questionsLoading || domainsLoading}
              onQuestionEdit={setEditingQuestion}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
