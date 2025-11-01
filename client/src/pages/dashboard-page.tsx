import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { DownloadFile, User } from "@shared/schema";
import { Download, Users, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/hooks/use-realtime";
import { AnnouncementsBanner } from "@/components/announcements-banner";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Enable real-time updates for stats
  useRealtime();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalDownloads: number;
    availableFiles: number;
    totalUsers?: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your account
        </p>
      </div>

      <AnnouncementsBanner />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-available-files">
                {stats?.availableFiles || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Files ready to download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-downloads">
                {stats?.totalDownloads || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All-time downloads
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-users">
                  {stats?.totalUsers || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Registered users
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Username</span>
            <span className="text-sm text-muted-foreground">{user?.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Role</span>
            <span className="text-sm text-muted-foreground capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Account Status</span>
            <span className="text-sm text-muted-foreground">
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {user?.createdAt && (
            <div className="flex justify-between py-2">
              <span className="text-sm font-medium">Member Since</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="/downloads"
              className="flex items-center gap-3 p-4 rounded-lg border hover-elevate active-elevate-2 transition-colors"
              data-testid="link-quick-downloads"
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">View Downloads</h3>
                <p className="text-xs text-muted-foreground">
                  Access all available files
                </p>
              </div>
            </a>

            {isAdmin && (
              <a
                href="/admin/users"
                className="flex items-center gap-3 p-4 rounded-lg border hover-elevate active-elevate-2 transition-colors"
                data-testid="link-quick-users"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Manage Users</h3>
                  <p className="text-xs text-muted-foreground">
                    View and edit user accounts
                  </p>
                </div>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
