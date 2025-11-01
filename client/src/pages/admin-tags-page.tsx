import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import type { FileTag } from "@shared/schema";
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

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

type TagFormData = z.infer<typeof tagSchema>;

export default function AdminTagsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<FileTag | null>(null);
  const { toast } = useToast();

  const { data: tags = [], isLoading } = useQuery<FileTag[]>({
    queryKey: ["/api/tags"],
  });

  const createForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "", color: "#3b82f6" },
  });

  const editForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: TagFormData) => apiRequest("POST", "/api/admin/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({ title: "Success", description: "Tag created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create tag", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TagFormData> }) =>
      apiRequest("PATCH", `/api/admin/tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({ title: "Success", description: "Tag updated successfully" });
      setEditingTag(null);
      editForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tag", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({ title: "Success", description: "Tag deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete tag", variant: "destructive" });
    },
  });

  const onCreateSubmit = (data: TagFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: TagFormData) => {
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data });
    }
  };

  const handleEdit = (tag: FileTag) => {
    setEditingTag(tag);
    editForm.reset({ name: tag.name, color: tag.color || undefined });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-tags">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Tags Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage file tags</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-tag">
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-tag">
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Important" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} data-testid="input-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tags yet</p>
            <p className="text-sm text-muted-foreground">Create tags to organize your files</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="relative" data-testid={`card-tag-${tag.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Badge style={{ backgroundColor: tag.color || "#3b82f6" }}>
                    {tag.name}
                  </Badge>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingTag?.id === tag.id}
                      onOpenChange={(open) => !open && setEditingTag(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(tag)}
                          data-testid={`button-edit-${tag.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="dialog-edit-tag">
                        <DialogHeader>
                          <DialogTitle>Edit Tag</DialogTitle>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-edit-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editForm.control}
                              name="color"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <FormControl>
                                    <Input type="color" {...field} data-testid="input-edit-color" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingTag(null)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                                {updateMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-delete-${tag.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this tag? This will remove it from all files.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(tag.id)}
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
