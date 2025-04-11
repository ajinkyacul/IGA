import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form validation schema
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.string().default("Customer"),
  tenantId: z.coerce.number().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  tenantId?: number | null;
  user?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  onSuccess?: () => void;
}

export default function UserForm({ tenantId, user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const isEditing = !!user;
  
  // Initialize form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || "",
      password: isEditing ? "" : "", // Don't prefill password when editing
      email: user?.email || "",
      fullName: user?.fullName || "",
      role: user?.role || "Customer",
      tenantId: tenantId || undefined,
    },
  });

  // User creation/update mutation
  const userMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const endpoint = isEditing 
        ? `/api/admin/users/${user.id}` 
        : "/api/register";
      
      const method = isEditing ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: `User ${isEditing ? "updated" : "created"} successfully`,
        description: `The user has been ${isEditing ? "updated" : "created"}.`,
      });
      
      // Refresh user list
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users?tenantId=${tenantId}`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
      
      // Reset form if not editing
      if (!isEditing) {
        form.reset({
          username: "",
          password: "",
          email: "",
          fullName: "",
          role: "Customer",
          tenantId: tenantId || undefined,
        });
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} user`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: UserFormValues) {
    // If editing and password is empty, remove it from the values
    if (isEditing && !values.password) {
      const { password, ...valuesWithoutPassword } = values;
      userMutation.mutate(valuesWithoutPassword as UserFormValues);
    } else {
      userMutation.mutate(values);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter user's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines the user's permissions and access level.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Hidden tenant ID field - automatically set from props */}
        <input type="hidden" {...form.register("tenantId")} value={tenantId || ''} />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={userMutation.isPending}
        >
          {userMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update User" : "Create User"
          )}
        </Button>
      </form>
    </Form>
  );
}
