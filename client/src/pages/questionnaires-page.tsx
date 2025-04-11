import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DomainSection from "@/components/questionnaire/DomainSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

export default function QuestionnairesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all-domains");
  const [statusFilter, setStatusFilter] = useState("all-status");
  
  // Reset filters function
  const resetFilters = () => {
    setSearchQuery("");
    setDomainFilter("all-domains");
    setStatusFilter("all-status");
  };

  // Fetch tenant questions and domains
  const { data: tenantQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: [user?.tenantId ? `/api/tenant/${user.tenantId}/questions` : null],
    enabled: !!user?.tenantId,
  });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/domains"],
  });

  // Group questions by domain
  const groupedQuestions = () => {
    if (!tenantQuestions || !domains) return [];

    const groupedByDomain = domains.map(domain => {
      // Filter questions by domain and additional filters
      const domainQuestions = tenantQuestions.filter(tq => {
        const matchesDomain = tq.question.domainId === domain.id;
        const matchesSearch = !searchQuery || 
          tq.question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tq.question.description && tq.question.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = !statusFilter || statusFilter === "all-status" || tq.status === statusFilter;
        
        return matchesDomain && matchesSearch && matchesStatus;
      });

      return {
        domain,
        questions: domainQuestions,
      };
    });

    // Filter out domains with no matching questions
    return groupedByDomain.filter(group => group.questions.length > 0);
  };
  
  // Check if any filters are applied
  const hasFilters = searchQuery || 
    (domainFilter && domainFilter !== "all-domains") || 
    (statusFilter && statusFilter !== "all-status");

  // Filter domains based on domainFilter
  const filteredGroups = hasFilters ? 
    groupedQuestions().filter(group => 
      domainFilter === "all-domains" || !domainFilter || group.domain.id.toString() === domainFilter
    ) : 
    groupedQuestions();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Questionnaires</h1>
            <p className="text-sm text-slate-500">Manage your identity governance requirements</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-domains">All Domains</SelectItem>
                {domains?.map(domain => (
                  <SelectItem key={domain.id} value={domain.id.toString()}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">Status: All</SelectItem>
                <SelectItem value="Answered">Answered</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Unanswered">Unanswered</SelectItem>
              </SelectContent>
            </Select>
            
            {hasFilters && (
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={resetFilters}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        {questionsLoading || domainsLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredGroups.length > 0 ? (
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <DomainSection 
                    key={group.domain.id} 
                    domain={group.domain} 
                    questions={group.questions}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-700 mb-2">No questions found</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  {hasFilters 
                    ? "No questions match your current filters. Try adjusting your search criteria."
                    : "There are no questions assigned to your tenant yet. Please contact an administrator."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
