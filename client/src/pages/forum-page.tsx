import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Pin, Lock, ChevronRight, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ForumCategory = { id: string; name: string; description: string; displayOrder: number; isLocked: boolean; createdAt: Date; updatedAt: Date };

const createThreadSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export default function ForumPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);

  const form = useForm<z.infer<typeof createThreadSchema>>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: selectedCategoryId || "",
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createThreadSchema>) => {
      return await apiRequest("POST", "/api/forum/threads", data);
    },
    onSuccess: () => {
      toast({ title: "Thread created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create thread", variant: "destructive" });
    },
  });

  function handleCreateThread(data: z.infer<typeof createThreadSchema>) {
    createThreadMutation.mutate({ ...data, categoryId: selectedCategoryId! });
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6" data-testid="page-forum">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-forum-title">Community Forum</h1>
          <p className="text-muted-foreground">Discuss, share, and connect with the community</p>
        </div>
      </div>

      {categoriesLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : !selectedCategoryId ? (
        <div className="grid gap-4" data-testid="list-forum-categories">
          {categories?.map((category) => (
            <Card
              key={category.id}
              className="hover-elevate active-elevate-2 cursor-pointer transition-colors"
              onClick={() => setSelectedCategoryId(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl" data-testid={`text-category-name-${category.id}`}>
                        {category.name}
                      </CardTitle>
                      {category.isLocked && (
                        <Badge variant="secondary" data-testid={`badge-locked-${category.id}`}>
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <CardDescription data-testid={`text-category-desc-${category.id}`}>
                      {category.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <ThreadsView
          categoryId={selectedCategoryId}
          categoryName={selectedCategory?.name || ""}
          isLocked={selectedCategory?.isLocked || false}
          onBack={() => setSelectedCategoryId(null)}
        />
      )}

      <Dialog open={isCreateDialogOpen && !!selectedCategoryId} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-thread">
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
            <DialogDescription>Start a new discussion in {selectedCategory?.name}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateThread)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Thread title" data-testid="input-thread-title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's on your mind?"
                        className="min-h-32"
                        data-testid="input-thread-content"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createThreadMutation.isPending} data-testid="button-create-thread">
                  {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Thread = { id: string; categoryId: string; title: string; isPinned: boolean; isLocked: boolean; viewCount: number; replyCount: number; createdById: string; lastPostAt: Date; lastPostById: string | null; createdAt: Date; updatedAt: Date };

function ThreadsView({ categoryId, categoryName, isLocked, onBack }: { categoryId: string; categoryName: string; isLocked: boolean; onBack: () => void }) {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: threads, isLoading } = useQuery<Thread[]>({
    queryKey: ["/api/forum/threads", categoryId],
    queryFn: () => fetch(`/api/forum/threads?categoryId=${categoryId}`, { credentials: "include" }).then(r => r.json()),
  });

  const form = useForm<z.infer<typeof createThreadSchema>>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: { title: "", content: "", categoryId: "" },
  });

  useEffect(() => {
    if (categoryId) {
      form.setValue("categoryId", categoryId);
    }
  }, [categoryId, form]);

  const createThreadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createThreadSchema>) => {
      return await apiRequest("POST", "/api/forum/threads", data);
    },
    onSuccess: () => {
      toast({ title: "Thread created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads"] });
      setIsCreateDialogOpen(false);
      form.reset({ title: "", content: "", categoryId });
    },
    onError: () => {
      toast({ title: "Failed to create thread", variant: "destructive" });
    },
  });

  function handleCreateThread(data: z.infer<typeof createThreadSchema>) {
    createThreadMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} data-testid="button-back-to-categories">
            ← Back to Categories
          </Button>
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-category-name">{categoryName}</h2>
          </div>
        </div>
        {!isLocked && (
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-new-thread">
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : threads?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No threads yet. Be the first to start a discussion!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="list-threads">
          {threads?.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.lastPostAt).getTime() - new Date(a.lastPostAt).getTime();
          }).map((thread) => (
            <Card
              key={thread.id}
              className="hover-elevate active-elevate-2 cursor-pointer transition-colors"
              onClick={() => setLocation(`/forum/thread/${thread.id}`)}
              data-testid={`card-thread-${thread.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.isPinned && (
                        <Pin className="w-4 h-4 text-primary" data-testid={`icon-pinned-${thread.id}`} />
                      )}
                      <CardTitle className="text-lg" data-testid={`text-thread-title-${thread.id}`}>
                        {thread.title}
                      </CardTitle>
                      {thread.isLocked && (
                        <Lock className="w-4 h-4 text-muted-foreground" data-testid={`icon-locked-${thread.id}`} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1" data-testid={`text-reply-count-${thread.id}`}>
                        <MessageSquare className="w-4 h-4" />
                        {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                      </span>
                      <span data-testid={`text-view-count-${thread.id}`}>
                        {thread.viewCount} {thread.viewCount === 1 ? "view" : "views"}
                      </span>
                      <span data-testid={`text-last-post-${thread.id}`}>
                        Last post {formatDistanceToNow(new Date(thread.lastPostAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-thread">
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
            <DialogDescription>Start a new discussion in {categoryName}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateThread)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Thread title" data-testid="input-thread-title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's on your mind?"
                        className="min-h-32"
                        data-testid="input-thread-content"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createThreadMutation.isPending} data-testid="button-submit-thread">
                  {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
