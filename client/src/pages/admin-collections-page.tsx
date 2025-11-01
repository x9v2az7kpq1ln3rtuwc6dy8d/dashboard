import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import type { FileCollection } from "@shared/schema";
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

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function AdminCollectionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FileCollection | null>(null);
  const { toast } = useToast();

  const { data: collections = [], isLoading } = useQuery<FileCollection[]>({
    queryKey: ["/api/collections"],
  });

  const createForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CollectionFormData) => apiRequest("POST", "/api/admin/collections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Success", description: "Collection created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create collection", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CollectionFormData> }) =>
      apiRequest("PATCH", `/api/admin/collections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Success", description: "Collection updated successfully" });
      setEditingCollection(null);
      editForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update collection", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Success", description: "Collection deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete collection", variant: "destructive" });
    },
  });

  const onCreateSubmit = (data: CollectionFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: CollectionFormData) => {
    if (editingCollection) {
      updateMutation.mutate({ id: editingCollection.id, data });
    }
  };

  const handleEdit = (collection: FileCollection) => {
    setEditingCollection(collection);
    editForm.reset({ name: collection.name, description: collection.description || "" });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-collections">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Collections</h1>
          <p className="text-sm text-muted-foreground">Organize files into collections</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-collection">
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-collection">
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
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
                        <Input {...field} placeholder="Essential Tools" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Collection description..." rows={3} data-testid="input-description" />
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
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No collections yet</p>
            <p className="text-sm text-muted-foreground">Create collections to organize your files</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection.id} data-testid={`card-collection-${collection.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingCollection?.id === collection.id}
                      onOpenChange={(open) => !open && setEditingCollection(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(collection)}
                          data-testid={`button-edit-${collection.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="dialog-edit-collection">
                        <DialogHeader>
                          <DialogTitle>Edit Collection</DialogTitle>
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
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} rows={3} data-testid="input-edit-description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setEditingCollection(null)}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-delete-${collection.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this collection? Files will not be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(collection.id)}
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
