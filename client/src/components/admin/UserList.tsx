import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, UserCog, Pencil, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserForm from "./UserForm";

interface UserListProps {
  tenantId: number;
}

export default function UserList({ tenantId }: UserListProps) {
  const { toast } = useToast();
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Fetch users for this tenant
  const { data: users, isLoading } = useQuery({
    queryKey: [`/api/admin/users?tenantId=${tenantId}`],
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      });
      
      // Refresh users list
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users?tenantId=${tenantId}`] });
      
      // Reset deleting state
      setDeletingUserId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
      setDeletingUserId(null);
    }
  });

  // Handle user deletion
  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Get avatar color based on role
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8">
        <UserCog className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">No users found for this tenant</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user: any) => (
        <div key={user.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-slate-50">
          <div className="flex items-center space-x-3">
            <Avatar className={getAvatarColor(user.role)}>
              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            
            <div>
              <p className="font-medium text-slate-800">{user.fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {user.role}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  @{user.username}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              
              <AlertDialog open={deletingUserId === user.id} onOpenChange={(open) => !open && setDeletingUserId(null)}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeletingUserId(user.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the user "{user.fullName}" and all their data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      {deleteUserMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : "Delete User"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm 
              user={editingUser} 
              tenantId={tenantId}
              onSuccess={() => setEditingUser(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
