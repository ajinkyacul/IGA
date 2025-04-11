import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTenantSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Extend the base schema with validation
const formSchema = insertTenantSchema.extend({
  name: z.string().min(2, {
    message: "Tenant name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  industry: z.string().optional(),
});

interface TenantFormProps {
  tenant?: {
    id: number;
    name: string;
    description?: string;
    industry?: string;
  };
  onSuccess?: () => void;
}

export default function TenantForm({ tenant, onSuccess }: TenantFormProps) {
  const { toast } = useToast();
  const isEditing = !!tenant;

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tenant?.name || "",
      description: tenant?.description || "",
      industry: tenant?.industry || "",
    },
  });

  // Create or update tenant mutation
  const tenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest(
        isEditing ? "PUT" : "POST",
        isEditing ? `/api/admin/tenants/${tenant.id}` : "/api/admin/tenants",
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: `Tenant ${isEditing ? "updated" : "created"} successfully`,
        description: `The tenant has been ${isEditing ? "updated" : "created"}.`,
      });
      
      // Invalidate queries to refresh tenant list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      
      // Reset form if not editing
      if (!isEditing) {
        form.reset({
          name: "",
          description: "",
          industry: "",
        });
      }
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} tenant`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    tenantMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter tenant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Healthcare, Financial, Technology" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the tenant organization"
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={tenantMutation.isPending}
        >
          {tenantMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Tenant" : "Create Tenant"
          )}
        </Button>
      </form>
    </Form>
  );
}
