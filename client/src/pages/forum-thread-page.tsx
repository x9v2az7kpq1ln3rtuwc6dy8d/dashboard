import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Pin, Lock, Send, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Thread = { id: string; categoryId: string; title: string; isPinned: boolean; isLocked: boolean; viewCount: number; replyCount: number; createdById: string; lastPostAt: Date; lastPostById: string | null; createdAt: Date; updatedAt: Date };
type Post = { id: string; threadId: string; content: string; createdById: string; isEdited: boolean; editedAt: Date | null; createdAt: Date; updatedAt: Date };
type User = { id: string; username: string; avatar: string | null; role: string };

export default function ForumThreadPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/forum/thread/:id");
  const threadId = params?.id;
  const [replyContent, setReplyContent] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: thread, isLoading: threadLoading } = useQuery<Thread>({
    queryKey: ["/api/forum/threads", threadId],
    queryFn: () => fetch(`/api/forum/threads/${threadId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!threadId,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/forum/threads", threadId, "posts"],
    queryFn: () => fetch(`/api/forum/threads/${threadId}/posts`, { credentials: "include" }).then(r => r.json()),
    enabled: !!threadId,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!posts,
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/forum/threads/${threadId}/posts`, { content });
    },
    onSuccess: () => {
      toast({ title: "Reply posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", threadId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", threadId] });
      setReplyContent("");
    },
    onError: () => {
      toast({ title: "Failed to post reply", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("DELETE", `/api/forum/posts/${postId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Post deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", threadId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", threadId] });
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  function handleReply() {
    if (!replyContent.trim()) {
      toast({ title: "Reply cannot be empty", variant: "destructive" });
      return;
    }
    replyMutation.mutate(replyContent);
  }

  function handleDeletePost(postId: string) {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  }

  function getUserById(userId: string) {
    return users?.find(u => u.id === userId);
  }

  const isLocked = thread?.isLocked || false;
  const canReply = !isLocked || user?.role === "admin" || user?.role === "moderator";

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6" data-testid="page-thread-detail">
      <Button variant="outline" onClick={() => navigate("/forum")} data-testid="button-back-to-forum">
        ← Back to Forum
      </Button>

      {threadLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>
      ) : thread ? (
        <Card data-testid="card-thread">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {thread.isPinned && (
                    <Pin className="w-5 h-5 text-primary" data-testid="icon-thread-pinned" />
                  )}
                  <CardTitle className="text-2xl" data-testid="text-thread-title">{thread.title}</CardTitle>
                  {thread.isLocked && (
                    <Badge variant="secondary" data-testid="badge-thread-locked">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-4" data-testid="text-thread-stats">
                  <span>{thread.viewCount} views</span>
                  <span>{thread.replyCount} replies</span>
                  <span>Last activity {formatDistanceToNow(new Date(thread.lastPostAt), { addSuffix: true })}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-testid="list-posts">
          {posts?.map((post) => {
            const author = getUserById(post.createdById);
            const canDelete = user?.role === "admin" || user?.role === "moderator" || post.createdById === user?.id;

            return (
              <Card key={post.id} data-testid={`card-post-${post.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12" data-testid={`avatar-${post.id}`}>
                      <AvatarImage src={author?.avatar || undefined} />
                      <AvatarFallback>{author?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" data-testid={`text-author-${post.id}`}>
                            {author?.username || "Unknown"}
                          </span>
                          <Badge variant="outline" data-testid={`badge-role-${post.id}`}>
                            {author?.role || "user"}
                          </Badge>
                          <span className="text-sm text-muted-foreground" data-testid={`text-timestamp-${post.id}`}>
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            {post.isEdited && " (edited)"}
                          </span>
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePost(post.id)}
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>{post.content}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {canReply && (
        <Card data-testid="card-reply">
          <CardHeader>
            <CardTitle className="text-lg">Post a Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-32"
              data-testid="input-reply-content"
            />
            <Button
              onClick={handleReply}
              disabled={replyMutation.isPending || !replyContent.trim()}
              data-testid="button-post-reply"
            >
              <Send className="w-4 h-4 mr-2" />
              {replyMutation.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!canReply && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2" />
            <p>This thread is locked. Only moderators and administrators can reply.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
