import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Megaphone } from "lucide-react";
import { format } from "date-fns";
import type { Announcement } from "@shared/schema";
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

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isActive: z.boolean().default(true),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function AdminAnnouncementsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
  });

  const createForm = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      isActive: true,
    },
  });

  const editForm = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: AnnouncementFormData) => apiRequest("POST", "/api/admin/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Success", description: "Announcement created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create announcement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnouncementFormData> }) => 
      apiRequest("PATCH", `/api/admin/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Success", description: "Announcement updated successfully" });
      setEditingAnnouncement(null);
      editForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Success", description: "Announcement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const onCreateSubmit = (data: AnnouncementFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: AnnouncementFormData) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    editForm.reset({
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive,
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-announcements">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Announcements</h1>
          <p className="text-sm text-muted-foreground">Manage system-wide announcements</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-announcement">
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-announcement">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Important Update" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Announcement details..."
                          rows={4}
                          data-testid="input-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <div className="text-sm text-muted-foreground">Show this announcement to users</div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
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
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No announcements yet</p>
            <p className="text-sm text-muted-foreground">Create your first announcement to notify users</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} data-testid={`card-announcement-${announcement.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {announcement.title}
                      {!announcement.isActive && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {format(new Date(announcement.createdAt), "PPp")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={editingAnnouncement?.id === announcement.id}
                      onOpenChange={(open) => !open && setEditingAnnouncement(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                          data-testid={`button-edit-${announcement.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="dialog-edit-announcement">
                        <DialogHeader>
                          <DialogTitle>Edit Announcement</DialogTitle>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                              control={editForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-edit-title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editForm.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Content</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} rows={4} data-testid="input-edit-content" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Active</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Show this announcement to users
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-edit-is-active"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingAnnouncement(null)}
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
                        <Button variant="ghost" size="icon" data-testid={`button-delete-${announcement.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this announcement? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(announcement.id)}
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
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
