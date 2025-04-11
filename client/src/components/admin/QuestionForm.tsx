import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Extend the base schema with validation
const formSchema = insertQuestionSchema.extend({
  title: z.string().min(5, {
    message: "Question title must be at least 5 characters.",
  }),
  description: z.string().optional(),
  domainId: z.coerce.number({
    required_error: "Please select a domain.",
    invalid_type_error: "Domain must be a number."
  }),
  required: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

interface QuestionFormProps {
  question?: {
    id: number;
    title: string;
    description?: string;
    domainId: number;
    required: boolean;
    tags?: string[];
  };
  onSuccess?: () => void;
}

export default function QuestionForm({ question, onSuccess }: QuestionFormProps) {
  const { toast } = useToast();
  const isEditing = !!question;

  // Fetch domains
  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/domains"],
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: question?.title || "",
      description: question?.description || "",
      domainId: question?.domainId || 0,
      required: question?.required || false,
      tags: question?.tags || [],
    },
  });

  // Create or update question mutation
  const questionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest(
        isEditing ? "PUT" : "POST",
        isEditing ? `/api/admin/questions/${question.id}` : "/api/admin/questions",
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: `Question ${isEditing ? "updated" : "created"} successfully`,
        description: `The question has been ${isEditing ? "updated" : "created"}.`,
      });
      
      // Invalidate queries to refresh question list
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      
      // Reset form if not editing
      if (!isEditing) {
        form.reset({
          title: "",
          description: "",
          domainId: 0,
          required: false,
          tags: [],
        });
      }
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} question`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    questionMutation.mutate(values);
  }

  // Tags input handling (simplified for now)
  const [tagInput, setTagInput] = useState("");
  
  const addTag = () => {
    if (tagInput.trim() && !form.getValues().tags?.includes(tagInput.trim())) {
      const currentTags = form.getValues().tags || [];
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues().tags || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter question title" {...field} />
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
                  placeholder="Provide more details about the question"
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                This will help users understand what is being asked.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domainId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value?.toString()}
                disabled={domainsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {domains?.map((domain: any) => (
                    <SelectItem key={domain.id} value={domain.id.toString()}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The category this question belongs to.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Required Question</FormLabel>
                <FormDescription>
                  Mark this question as mandatory for all tenants.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Tags field (simplified) */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className="ml-2"
              onClick={addTag}
            >
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {form.watch("tags")?.map((tag, index) => (
              <div
                key={index}
                className="bg-slate-100 px-2 py-1 rounded-full text-xs flex items-center"
              >
                {tag}
                <button
                  type="button"
                  className="ml-1 text-slate-500 hover:text-slate-800"
                  onClick={() => removeTag(tag)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={questionMutation.isPending}
        >
          {questionMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Question" : "Create Question"
          )}
        </Button>
      </form>
    </Form>
  );
}
