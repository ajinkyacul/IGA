import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TenantList from "@/components/admin/TenantList";
import TenantForm from "@/components/admin/TenantForm";
import UserForm from "@/components/admin/UserForm";
import UserList from "@/components/admin/UserList";
import AssignQuestionsModal from "@/components/admin/AssignQuestionsModal";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users, Building } from "lucide-react";

export default function TenantManagementPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateTenantDialogOpen, setIsCreateTenantDialogOpen] = useState(false);
  const [isAssignQuestionsDialogOpen, setIsAssignQuestionsDialogOpen] = useState(false);

  // Fetch tenants
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ["/api/admin/tenants"],
  });

  // Select first tenant by default if none selected
  if (tenants?.length > 0 && !selectedTenantId) {
    setSelectedTenantId(tenants[0].id);
  }

  // Get the selected tenant details
  const selectedTenant = tenants?.find((tenant: any) => tenant.id === selectedTenantId);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tenant Management</h1>
            <p className="text-sm text-slate-500">Manage customer tenants and their users</p>
          </div>

          <div className="flex space-x-3">
            <Dialog open={isCreateTenantDialogOpen} onOpenChange={setIsCreateTenantDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>
                    Add a new customer tenant to the platform.
                  </DialogDescription>
                </DialogHeader>
                <TenantForm 
                  onSuccess={() => setIsCreateTenantDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to a tenant organization.
                  </DialogDescription>
                </DialogHeader>
                <UserForm 
                  tenantId={selectedTenantId} 
                  onSuccess={() => setIsCreateUserDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isAssignQuestionsDialogOpen} onOpenChange={setIsAssignQuestionsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Questions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Assign Questions to Tenant</DialogTitle>
                  <DialogDescription>
                    Select questions to assign to this tenant.
                  </DialogDescription>
                </DialogHeader>
                {selectedTenantId && (
                  <AssignQuestionsModal 
                    tenantId={selectedTenantId} 
                    onSuccess={() => setIsAssignQuestionsDialogOpen(false)} 
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tenants List */}
          <Card className="md:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tenants</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TenantList 
                tenants={tenants || []} 
                isLoading={tenantsLoading}
                selectedTenantId={selectedTenantId}
                onTenantSelect={setSelectedTenantId}
                onTenantEdit={setEditingTenant}
              />
            </CardContent>
          </Card>

          {/* Tenant Details */}
          <div className="md:col-span-3">
            {selectedTenant ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{selectedTenant.name}</CardTitle>
                      <CardDescription>{selectedTenant.industry || 'No industry specified'}</CardDescription>
                    </div>
                    <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tenant</DialogTitle>
                          <DialogDescription>
                            Update tenant information.
                          </DialogDescription>
                        </DialogHeader>
                        {editingTenant && (
                          <TenantForm 
                            tenant={editingTenant} 
                            onSuccess={() => setEditingTenant(null)} 
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="users">
                    <TabsList className="w-full">
                      <TabsTrigger value="users" className="flex-1">
                        <Users className="h-4 w-4 mr-2" />
                        Users
                      </TabsTrigger>
                      <TabsTrigger value="details" className="flex-1">
                        <Building className="h-4 w-4 mr-2" />
                        Details
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="users" className="pt-4">
                      <UserList tenantId={selectedTenant.id} />
                    </TabsContent>
                    
                    <TabsContent value="details" className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700">Description</h3>
                          <p className="text-slate-600 mt-1">
                            {selectedTenant.description || 'No description provided.'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700">Created</h3>
                          <p className="text-slate-600 mt-1">
                            {new Date(selectedTenant.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center">
                  <Building className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No tenant selected</h3>
                  <p className="text-slate-500">
                    Please select a tenant from the list or create a new one.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
