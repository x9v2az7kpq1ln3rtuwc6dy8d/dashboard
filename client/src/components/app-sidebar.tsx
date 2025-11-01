import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Download, Home, Settings, Shield, Users, Key, FileDown, LogOut, MessageCircle, User, History, HelpCircle, BarChart3, Megaphone, Tags, FolderOpen, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/role-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator" || isAdmin;

  const customerItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Downloads",
      url: "/downloads",
      icon: Download,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "History",
      url: "/history",
      icon: History,
    },
    {
      title: "FAQ",
      url: "/faq",
      icon: HelpCircle,
    },
    {
      title: "Community Forum",
      url: "/forum",
      icon: MessageSquare,
    },
    {
      title: "Support Chat",
      url: "/chat",
      icon: MessageCircle,
    },
  ];

  const adminItems = [
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Announcements",
      url: "/admin/announcements",
      icon: Megaphone,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Invite Codes",
      url: "/admin/invites",
      icon: Key,
    },
    {
      title: "File Management",
      url: "/admin/files",
      icon: FileDown,
    },
    {
      title: "Tags",
      url: "/admin/tags",
      icon: Tags,
    },
    {
      title: "Collections",
      url: "/admin/collections",
      icon: FolderOpen,
    },
    {
      title: "FAQ Management",
      url: "/admin/faq",
      icon: HelpCircle,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">Customer Portal</h2>
            <p className="text-xs text-muted-foreground">Download Center</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Customer Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-sidebar-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu */}
        {(isAdmin || isModerator) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-sidebar-${item.title.toLowerCase().replace(" ", "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-current-username">
                {user?.username}
              </p>
              <RoleBadge role={user?.role || "customer"} className="mt-1" />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
