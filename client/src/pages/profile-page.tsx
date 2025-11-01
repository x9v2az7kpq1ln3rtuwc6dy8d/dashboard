import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@shared/schema";
import { Pencil, Save, X, User as UserIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [bio, setBio] = useState("");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profile: { avatar?: string; discordUsername?: string; bio?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", profile);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setAvatar(user?.avatar || "");
    setDiscordUsername(user?.discordUsername || "");
    setBio(user?.bio || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      avatar: avatar || undefined,
      discordUsername: discordUsername || undefined,
      bio: bio || undefined,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatar("");
    setDiscordUsername("");
    setBio("");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} data-testid="button-edit-profile">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={isEditing ? avatar : user?.avatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.username?.charAt(0).toUpperCase() || <UserIcon className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    data-testid="input-avatar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to an image to use as your avatar
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-lg">{user?.username}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* Username (Read-only) */}
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={user?.username || ""} disabled />
            <p className="text-xs text-muted-foreground">Username cannot be changed</p>
          </div>

          {/* Discord Username */}
          <div className="space-y-2">
            <Label htmlFor="discord">Discord Username</Label>
            {isEditing ? (
              <Input
                id="discord"
                placeholder="username#1234"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                data-testid="input-discord"
              />
            ) : (
              <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {user?.discordUsername || <span className="text-muted-foreground">Not set</span>}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                data-testid="textarea-bio"
              />
            ) : (
              <div className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {user?.bio || <span className="text-muted-foreground">No bio yet</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
