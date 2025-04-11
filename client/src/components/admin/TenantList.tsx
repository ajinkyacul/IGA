import { useState } from "react";
import { Loader2, MoreVertical, Building, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface TenantListProps {
  tenants: any[];
  isLoading: boolean;
  selectedTenantId: number | null;
  onTenantSelect: (id: number) => void;
  onTenantEdit: (tenant: any) => void;
}

export default function TenantList({
  tenants,
  isLoading,
  selectedTenantId,
  onTenantSelect,
  onTenantEdit
}: TenantListProps) {
  const { toast } = useToast();
  const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      await apiRequest("DELETE", `/api/admin/tenants/${tenantId}`);
    },
    onSuccess: () => {
      toast({
        title: "Tenant deleted",
        description: "The tenant has been successfully deleted.",
      });
      
      // Refresh tenant list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      
      // Reset selected tenant if it was deleted
      if (selectedTenantId === deletingTenantId) {
        onTenantSelect(tenants.find(t => t.id !== deletingTenantId)?.id || 0);
      }
      
      // Reset deleting state
      setDeletingTenantId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting tenant",
        description: error.message,
        variant: "destructive",
      });
      setDeletingTenantId(null);
    }
  });

  // Handle tenant deletion
  const handleDeleteTenant = (tenantId: number) => {
    deleteTenantMutation.mutate(tenantId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center p-6">
        <Building className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">No tenants available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-1 p-1">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className={`flex items-center justify-between px-3 py-2 rounded-md ${
              selectedTenantId === tenant.id ? "bg-slate-100" : "hover:bg-slate-50"
            } cursor-pointer transition-colors`}
            onClick={() => onTenantSelect(tenant.id)}
          >
            <div className="flex items-center">
              <Building className="h-5 w-5 text-slate-500 mr-2" />
              <div>
                <p className="text-sm font-medium">{tenant.name}</p>
                <p className="text-xs text-slate-500">{tenant.industry || "No industry"}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTenantEdit(tenant)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                
                <AlertDialog open={deletingTenantId === tenant.id} onOpenChange={(open) => !open && setDeletingTenantId(null)}>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => {
                        e.preventDefault();
                        setDeletingTenantId(tenant.id);
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
                        This will permanently delete the tenant "{tenant.name}" and all associated data.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeleteTenant(tenant.id)}
                        disabled={deleteTenantMutation.isPending}
                      >
                        {deleteTenantMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : "Delete Tenant"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
