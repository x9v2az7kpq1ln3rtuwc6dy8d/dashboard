import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, Users, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format } from "date-fns";

export default function AdminAnalyticsPage() {
  const { data: downloadStats, isLoading: loadingDownloads } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/downloads"],
  });

  const { data: fileStats, isLoading: loadingFiles } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/files"],
  });

  const { data: userStats, isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/users"],
  });

  const totalDownloads = downloadStats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0;
  const activeUsers = userStats?.filter((u: any) => u.downloadCount > 0).length || 0;
  const totalFiles = fileStats?.length || 0;

  return (
    <div className="p-6 space-y-6" data-testid="page-analytics">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor downloads, files, and user activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-downloads">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-downloads">
              {loadingDownloads ? "..." : totalDownloads.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-users">
              {loadingUsers ? "..." : activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">With downloads</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-files">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-files">
              {loadingFiles ? "..." : totalFiles}
            </div>
            <p className="text-xs text-muted-foreground">Available downloads</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="downloads" className="space-y-4">
        <TabsList data-testid="tabs-analytics">
          <TabsTrigger value="downloads" data-testid="tab-downloads">Download Trends</TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">Popular Files</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="downloads" className="space-y-4">
          <Card data-testid="card-download-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Downloads Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDownloads ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : downloadStats && downloadStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={downloadStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), "MMM dd")}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), "PPP")}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <p className="text-muted-foreground">No download data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card data-testid="card-file-stats">
            <CardHeader>
              <CardTitle>Most Downloaded Files</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFiles ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-muted-foreground">Loading file stats...</p>
                </div>
              ) : fileStats && fileStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={fileStats.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="fileName" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="downloadCount" fill="hsl(var(--primary))" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <p className="text-muted-foreground">No file data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card data-testid="card-user-stats">
            <CardHeader>
              <CardTitle>User Download Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-muted-foreground">Loading user stats...</p>
                </div>
              ) : userStats && userStats.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 font-medium text-sm text-muted-foreground pb-2 border-b">
                    <div>Username</div>
                    <div>Downloads</div>
                    <div className="col-span-2">Last Active</div>
                  </div>
                  {userStats.slice(0, 20).map((stat: any) => (
                    <div key={stat.userId} className="grid grid-cols-4 text-sm py-2 border-b" data-testid={`row-user-${stat.userId}`}>
                      <div className="font-medium" data-testid={`text-username-${stat.userId}`}>{stat.username}</div>
                      <div data-testid={`text-download-count-${stat.userId}`}>{stat.downloadCount}</div>
                      <div className="col-span-2 text-muted-foreground" data-testid={`text-last-active-${stat.userId}`}>
                        {format(new Date(stat.lastActive), "PPp")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <p className="text-muted-foreground">No user activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
