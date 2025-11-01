import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import DownloadsPage from "@/pages/downloads-page";
import ProfilePage from "@/pages/profile-page";
import HistoryPage from "@/pages/history-page";
import FaqPage from "@/pages/faq-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminInvitesPage from "@/pages/admin-invites-page";
import AdminFilesPage from "@/pages/admin-files-page";
import AdminFaqPage from "@/pages/admin-faq-page";
import AdminAnalyticsPage from "@/pages/admin-analytics-page";
import AdminAnnouncementsPage from "@/pages/admin-announcements-page";
import AdminTagsPage from "@/pages/admin-tags-page";
import AdminCollectionsPage from "@/pages/admin-collections-page";
import ChatPage from "@/pages/chat-page";
import ForumPage from "@/pages/forum-page";
import ForumThreadPage from "@/pages/forum-thread-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/downloads" component={DownloadsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <ProtectedRoute path="/faq" component={FaqPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/forum" component={ForumPage} />
      <ProtectedRoute path="/forum/thread/:id" component={ForumThreadPage} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <ProtectedRoute path="/admin/invites" component={AdminInvitesPage} />
      <ProtectedRoute path="/admin/files" component={AdminFilesPage} />
      <ProtectedRoute path="/admin/faq" component={AdminFaqPage} />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalyticsPage} />
      <ProtectedRoute path="/admin/announcements" component={AdminAnnouncementsPage} />
      <ProtectedRoute path="/admin/tags" component={AdminTagsPage} />
      <ProtectedRoute path="/admin/collections" component={AdminCollectionsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-4 p-4 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-2">
                  <NotificationsBell />
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-y-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
