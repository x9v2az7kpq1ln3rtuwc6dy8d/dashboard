import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, User } from "lucide-react";
import { UserRole } from "@shared/schema";

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case "admin":
        return {
          icon: ShieldCheck,
          label: "Admin",
          variant: "default" as const,
        };
      case "moderator":
        return {
          icon: Shield,
          label: "Moderator",
          variant: "secondary" as const,
        };
      default:
        return {
          icon: User,
          label: "Customer",
          variant: "outline" as const,
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className} data-testid={`badge-role-${role}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
